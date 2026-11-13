import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { applySearch, pageOf, type Page } from '../common/list-query.js';
import type {
  Assignment,
  AssignmentCheckResult,
} from '../courses/assignment.entity.js';
import { Assignment as AssignmentEntity } from '../courses/assignment.entity.js';
import { Course } from '../courses/course.entity.js';
import {
  AssignmentRole,
  AssignmentStatus,
  CourseKind,
  CourseStatus,
  EmploymentType,
  Language,
} from '../database/enums.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import type {
  AssignInstructorDto,
  AutoStaffDto,
  CandidatesQuery,
  ListCoursesQuery,
} from './dto/course.dto.js';
import { isoWeek } from './engine/calendar.js';
import {
  checkInstructor,
  rankCandidates,
  type Candidate,
  type CourseToStaff,
  type EngineContext,
} from './engine/check.js';
import { Ledger } from './engine/ledger.js';
import { staffCourses } from './engine/staffing.js';
import type { IsoDate, PlanningSnapshot } from './engine/types.js';
import { SnapshotService } from './snapshot.service.js';

export interface CourseInstructorRef {
  assignmentId: string;
  id: string;
  firstName: string;
  lastName: string;
  role: AssignmentRole;
  status: AssignmentStatus;
}

/** One row of GET /courses: a Durchführung with its dates, seats and instructors. */
export interface CourseRow {
  id: string;
  courseType: {
    id: string;
    code: string;
    name: string;
    kind: CourseKind;
    durationDays: number;
  };
  location: { id: string; code: string; name: string };
  language: Language;
  status: CourseStatus;
  capacity: number;
  /** Enrollments registered or confirmed. */
  booked: number;
  startsOn: IsoDate | null;
  endsOn: IsoDate | null;
  dayCount: number;
  isoWeek: number | null;
  instructors: CourseInstructorRef[];
  planningRunId: string | null;
  planningIssue: string | null;
  externalRef: string | null;
}

export interface CourseAssignmentView {
  id: string;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    employmentType: EmploymentType;
    homeLocation: { id: string; code: string; name: string };
  };
  role: AssignmentRole;
  status: AssignmentStatus;
  score: number | null;
  checkResult: AssignmentCheckResult | null;
  confirmedAt: Date | null;
}

/** One ranked instructor of GET /courses/:id/candidates. */
export interface CandidateView {
  instructor: CourseAssignmentView['instructor'];
  result: AssignmentCheckResult;
}

interface AutoStaffCourseRef {
  courseId: string;
  code: string;
  location: string;
  isoWeek: number | null;
}

/** Answer of POST /courses/staff. */
export interface AutoStaffReport {
  dryRun: boolean;
  staffed: (AutoStaffCourseRef & {
    instructor: { id: string; firstName: string; lastName: string };
    score: number;
    candidateCount: number;
  })[];
  unstaffed: (AutoStaffCourseRef & { reason: string })[];
}

export interface CourseDetail extends CourseRow {
  cohort: { id: string; label: string } | null;
  timeWindow: { id: string; startsOn: IsoDate; endsOn: IsoDate } | null;
  days: {
    id: string;
    heldOn: IsoDate;
    startsAt: string;
    endsAt: string;
    sequence: number;
    room: { id: string; name: string; kind: string } | null;
  }[];
  assignments: CourseAssignmentView[];
  notes: string | null;
}

/** First course day; a correlated subquery so filters and sorting work without a join that multiplies rows. Raw `date` values come back as JS Dates, hence the `::text` casts in the aggregates. */
const STARTS_ON_SQL =
  '(SELECT MIN(d.held_on) FROM course_day d WHERE d.course_id = c.id)';
const HAS_INSTRUCTOR_SQL = `EXISTS (SELECT 1 FROM assignment a WHERE a.course_id = c.id AND a.status IN ('proposed', 'confirmed'))`;

const ACTIVE_ASSIGNMENTS = [
  AssignmentStatus.Proposed,
  AssignmentStatus.Confirmed,
];

interface DayAggregate {
  course_id: string;
  starts_on: string;
  ends_on: string;
  day_count: string;
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(AssignmentEntity)
    private readonly assignments: Repository<Assignment>,
    private readonly ds: DataSource,
    private readonly snapshots: SnapshotService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Durchführungen with their dates and instructors, filtered and (with
   * `page`) paged; the total goes into `X-Total-Count`. Without `from` the
   * list starts today, unless it is scoped to a planning run.
   */
  async list(
    query: ListCoursesQuery,
    today: IsoDate = new Date().toISOString().slice(0, 10),
  ): Promise<Page<CourseRow>> {
    const qb = this.courses
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.courseType', 'ct')
      .leftJoinAndSelect('c.location', 'l')
      .addSelect(STARTS_ON_SQL, 'c_starts_on');
    const from = query.from ?? (query.planningRunId ? undefined : today);
    if (from) qb.andWhere(`${STARTS_ON_SQL} >= :from`, { from });
    if (query.to) qb.andWhere(`${STARTS_ON_SQL} <= :to`, { to: query.to });
    if (query.locationId)
      qb.andWhere('c.locationId = :locationId', {
        locationId: query.locationId,
      });
    if (query.courseTypeId) {
      qb.andWhere('c.courseTypeId = :courseTypeId', {
        courseTypeId: query.courseTypeId,
      });
    }
    if (query.kind) qb.andWhere('ct.kind = :kind', { kind: query.kind });
    if (query.status)
      qb.andWhere('c.status = :status', { status: query.status });
    if (query.language)
      qb.andWhere('c.language = :language', { language: query.language });
    if (query.staffing === 'unstaffed')
      qb.andWhere(`NOT ${HAS_INSTRUCTOR_SQL}`);
    if (query.staffing === 'staffed') qb.andWhere(HAS_INSTRUCTOR_SQL);
    if (query.planningRunId) {
      qb.andWhere('c.planningRunId = :planningRunId', {
        planningRunId: query.planningRunId,
      });
    }
    applySearch(qb, ['ct.code', 'ct.name', 'l.name', 'c.externalRef'], query.q);
    const page = await pageOf(
      qb,
      query,
      {
        startsOn: 'c_starts_on',
        location: 'l.name',
        courseType: 'ct.code',
        status: 'c.status',
      },
      'startsOn',
      'c.id',
    );
    return { items: await this.toRows(page.items), total: page.total };
  }

  async get(id: string): Promise<CourseDetail> {
    const course = await this.courses.findOne({
      where: { id },
      relations: {
        courseType: true,
        location: true,
        cohort: true,
        timeWindow: true,
        days: { room: true },
        assignments: { instructor: { homeLocation: true } },
      },
    });
    if (!course) throw new NotFoundException('Kurs nicht gefunden.');
    const [row] = await this.toRows([course]);
    const days = [...course.days].sort((a, b) => a.sequence - b.sequence);
    const assignments = [...course.assignments].sort(
      (a, b) =>
        a.createdAt.getTime() - b.createdAt.getTime() ||
        a.id.localeCompare(b.id),
    );
    return {
      ...row,
      cohort: course.cohort
        ? { id: course.cohort.id, label: course.cohort.label }
        : null,
      timeWindow: course.timeWindow
        ? {
            id: course.timeWindow.id,
            startsOn: course.timeWindow.startsOn,
            endsOn: course.timeWindow.endsOn,
          }
        : null,
      days: days.map((d) => ({
        id: d.id,
        heldOn: d.heldOn,
        startsAt: d.startsAt,
        endsAt: d.endsAt,
        sequence: d.sequence,
        room: d.room
          ? { id: d.room.id, name: d.room.name, kind: d.room.kind }
          : null,
      })),
      assignments: assignments.map((a) => ({
        id: a.id,
        instructor: {
          id: a.instructor.id,
          firstName: a.instructor.firstName,
          lastName: a.instructor.lastName,
          employmentType: a.instructor.employmentType,
          homeLocation: {
            id: a.instructor.homeLocation.id,
            code: a.instructor.homeLocation.code,
            name: a.instructor.homeLocation.name,
          },
        },
        role: a.role,
        status: a.status,
        score: a.score,
        checkResult: a.checkResult,
        confirmedAt: a.confirmedAt,
      })),
      notes: course.notes,
    };
  }

  // --- Staffing of one course ----------------------------------------------

  /** Instructors ranked for the course; those already on it are left out. */
  async candidates(
    id: string,
    query: CandidatesQuery = {},
  ): Promise<CandidateView[]> {
    const course = await this.load(id);
    const ctx = await this.contextFor(course);
    const onCourse = new Set(
      activeAssignments(course).map((a) => a.instructorId),
    );
    const ranked = rankCandidates(toCourseToStaff(course), ctx, {
      includeInfeasible: query.all === 'true',
    }).filter((c) => !onCourse.has(c.instructor.id));
    return ranked
      .slice(0, query.limit ?? 6)
      .map((c) => toCandidateView(c, ctx.snapshot));
  }

  async check(
    id: string,
    instructorId: string,
  ): Promise<AssignmentCheckResult> {
    const course = await this.load(id);
    const ctx = await this.contextFor(course);
    const instructor = ctx.snapshot.instructors.get(instructorId);
    if (!instructor) throw new NotFoundException('Ausbilder nicht gefunden.');
    return checkInstructor(toCourseToStaff(course), instructor, ctx);
  }

  /**
   * Proposes the instructor for the course. A failed hard rule is a 409 with
   * the check in `details`, unless `force` is set; the stored `checkResult`
   * keeps the reasons either way.
   */
  async assign(
    id: string,
    dto: AssignInstructorDto,
    actor: AuthUser,
  ): Promise<CourseAssignmentView> {
    const course = await this.load(id);
    if (
      activeAssignments(course).some((a) => a.instructorId === dto.instructorId)
    ) {
      throw new ConflictException(
        'Dieser Ausbilder ist dem Kurs bereits zugewiesen.',
      );
    }
    const ctx = await this.contextFor(course);
    const instructor = ctx.snapshot.instructors.get(dto.instructorId);
    if (!instructor) throw new NotFoundException('Ausbilder nicht gefunden.');
    const result = checkInstructor(toCourseToStaff(course), instructor, ctx);
    if (!result.ok && !dto.force) {
      const failed = result.hard.find((h) => !h.ok);
      throw new ConflictException({
        message: `Harte Regel verletzt: ${failed?.reason ?? 'unbekannt'}`,
        details: { checkResult: result },
      });
    }
    const assignment = this.assignments.create({
      courseId: course.id,
      instructorId: dto.instructorId,
      role: dto.role ?? AssignmentRole.Lead,
      status: AssignmentStatus.Proposed,
      checkResult: result,
      score: result.score,
    });
    await this.assignments.save(assignment);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'assignment',
      entityId: assignment.id,
      action: 'create',
      after: snapshot(assignment),
      summary: `hat ${instructor.firstName} ${instructor.lastName} dem Kurs ${courseLabel(course)} zugewiesen (Score ${result.score}${result.ok ? '' : ', harte Regel verletzt'})`,
    });
    return this.assignmentView(assignment.id);
  }

  async confirmAssignment(
    assignmentId: string,
    actor: AuthUser,
  ): Promise<CourseAssignmentView> {
    const assignment = await this.loadAssignment(assignmentId);
    if (assignment.status !== AssignmentStatus.Proposed) {
      throw new ConflictException(
        'Nur vorgeschlagene Zuweisungen können bestätigt werden.',
      );
    }
    const before = snapshot(assignment);
    assignment.status = AssignmentStatus.Confirmed;
    assignment.confirmedByUserId = actor.dbUserId;
    assignment.confirmedAt = new Date();
    await this.assignments.save(assignment);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'assignment',
      entityId: assignment.id,
      action: 'confirm',
      before,
      after: snapshot(assignment),
      summary: `hat die Zuweisung von ${assignment.instructor.firstName} ${assignment.instructor.lastName} für ${courseLabel(assignment.course)} bestätigt`,
    });
    return this.assignmentView(assignment.id);
  }

  async removeAssignment(assignmentId: string, actor: AuthUser): Promise<void> {
    const assignment = await this.loadAssignment(assignmentId);
    await this.assignments.delete(assignment.id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'assignment',
      entityId: assignment.id,
      action: 'delete',
      before: snapshot(assignment),
      summary: `hat die Zuweisung von ${assignment.instructor.firstName} ${assignment.instructor.lastName} für ${courseLabel(assignment.course)} aufgehoben`,
    });
  }

  /**
   * Staffs every unstaffed course (planned, confirmed or open) of the range
   * with the engine's best feasible instructor; writes proposed assignments
   * unless `dryRun`.
   */
  async autoStaff(
    dto: AutoStaffDto,
    actor: AuthUser,
  ): Promise<AutoStaffReport> {
    if (dto.from > dto.to) {
      throw new ConflictException('Das Enddatum liegt vor dem Startdatum.');
    }
    const qb = this.courses
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.courseType', 'ct')
      .leftJoinAndSelect('c.location', 'l')
      .leftJoinAndSelect('c.days', 'd')
      .leftJoinAndSelect('c.assignments', 'a')
      .where(`${STARTS_ON_SQL} BETWEEN :from AND :to`, {
        from: dto.from,
        to: dto.to,
      })
      .andWhere('c.status IN (:...statuses)', {
        statuses: [
          CourseStatus.Planned,
          CourseStatus.Confirmed,
          CourseStatus.Open,
        ],
      })
      .andWhere(`NOT ${HAS_INSTRUCTOR_SQL}`);
    if (dto.locationId)
      qb.andWhere('c.locationId = :locationId', { locationId: dto.locationId });
    if (dto.kind) qb.andWhere('ct.kind = :kind', { kind: dto.kind });
    const courses = (await qb.getMany()).sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    const snap = await this.snapshots.load(
      { from: dto.from, to: dto.to },
      { includeApprentices: false },
    );
    const ctx: EngineContext = {
      snapshot: snap,
      ledger: Ledger.fromSnapshot(snap),
      today: snap.asOf,
    };
    const result = staffCourses(courses.map(toCourseToStaff), ctx);
    const courseOf = new Map(courses.map((c) => [c.id, c]));
    const ref = (courseId: string): AutoStaffCourseRef => {
      const course = courseOf.get(courseId)!;
      const dates = sortedDates(course);
      return {
        courseId,
        code: course.courseType.code,
        location: course.location.name,
        isoWeek: dates.length ? isoWeek(dates[0]).week : null,
      };
    };
    const dryRun = dto.dryRun ?? false;
    if (!dryRun) {
      for (const s of result.staffed) {
        const instructor = snap.instructors.get(s.instructorId)!;
        const assignment = this.assignments.create({
          courseId: s.courseId,
          instructorId: s.instructorId,
          role: AssignmentRole.Lead,
          status: AssignmentStatus.Proposed,
          checkResult: s.result,
          score: s.result.score,
        });
        await this.assignments.save(assignment);
        await this.audit.record({
          actorUserId: actor.dbUserId,
          entityType: 'assignment',
          entityId: assignment.id,
          action: 'create',
          after: snapshot(assignment),
          summary: `hat ${instructor.firstName} ${instructor.lastName} dem Kurs ${courseLabel(courseOf.get(s.courseId)!)} automatisch zugewiesen (Score ${s.result.score})`,
        });
      }
    }
    return {
      dryRun,
      staffed: result.staffed.map((s) => {
        const instructor = snap.instructors.get(s.instructorId)!;
        return {
          ...ref(s.courseId),
          instructor: {
            id: instructor.id,
            firstName: instructor.firstName,
            lastName: instructor.lastName,
          },
          score: s.result.score,
          candidateCount: s.candidateCount,
        };
      }),
      unstaffed: result.unstaffed.map((u) => ({
        ...ref(u.courseId),
        reason: u.reason,
      })),
    };
  }

  /** Snapshot and ledger around the course's dates; apprentices are not needed for staffing. */
  private async contextFor(course: Course): Promise<EngineContext> {
    const dates = sortedDates(course);
    const today = new Date().toISOString().slice(0, 10);
    const range = dates.length
      ? { from: dates[0], to: dates[dates.length - 1] }
      : { from: today, to: today };
    const snap = await this.snapshots.load(range, {
      includeApprentices: false,
    });
    return {
      snapshot: snap,
      ledger: Ledger.fromSnapshot(snap),
      today: snap.asOf,
    };
  }

  private async loadAssignment(id: string): Promise<Assignment> {
    const assignment = await this.assignments.findOne({
      where: { id },
      relations: {
        instructor: { homeLocation: true },
        course: { courseType: true, location: true, days: true },
      },
    });
    if (!assignment) throw new NotFoundException('Zuweisung nicht gefunden.');
    return assignment;
  }

  private async assignmentView(id: string): Promise<CourseAssignmentView> {
    const a = await this.loadAssignment(id);
    return {
      id: a.id,
      instructor: {
        id: a.instructor.id,
        firstName: a.instructor.firstName,
        lastName: a.instructor.lastName,
        employmentType: a.instructor.employmentType,
        homeLocation: {
          id: a.instructor.homeLocation.id,
          code: a.instructor.homeLocation.code,
          name: a.instructor.homeLocation.name,
        },
      },
      role: a.role,
      status: a.status,
      score: a.score,
      checkResult: a.checkResult,
      confirmedAt: a.confirmedAt,
    };
  }

  /** The course with its days, or 404. */
  async load(id: string): Promise<Course> {
    const course = await this.courses.findOne({
      where: { id },
      relations: {
        courseType: true,
        location: true,
        days: true,
        assignments: true,
      },
    });
    if (!course) throw new NotFoundException('Kurs nicht gefunden.');
    return course;
  }

  /** Rows for loaded courses (with `courseType` and `location`): dates, seats and instructors in three bulk queries. */
  async toRows(courses: Course[]): Promise<CourseRow[]> {
    if (courses.length === 0) return [];
    const ids = courses.map((c) => c.id);
    const [days, booked, assignments] = await Promise.all([
      this.ds.query(
        `SELECT course_id, MIN(held_on)::text AS starts_on, MAX(held_on)::text AS ends_on, COUNT(*) AS day_count
         FROM course_day WHERE course_id = ANY($1) GROUP BY course_id`,
        [ids],
      ) as Promise<DayAggregate[]>,
      this.ds.query(
        `SELECT course_id, COUNT(*) AS booked FROM enrollment
         WHERE course_id = ANY($1) AND status IN ('registered', 'confirmed') GROUP BY course_id`,
        [ids],
      ) as Promise<{ course_id: string; booked: string }[]>,
      this.assignments.find({
        where: { courseId: In(ids), status: In(ACTIVE_ASSIGNMENTS) },
        relations: { instructor: true },
        order: { createdAt: 'ASC' },
      }),
    ]);
    const daysOf = new Map(days.map((d) => [d.course_id, d]));
    const bookedOf = new Map(
      booked.map((b) => [b.course_id, Number(b.booked)]),
    );
    const instructorsOf = new Map<string, CourseInstructorRef[]>();
    for (const a of assignments) {
      const list = instructorsOf.get(a.courseId) ?? [];
      list.push({
        assignmentId: a.id,
        id: a.instructor.id,
        firstName: a.instructor.firstName,
        lastName: a.instructor.lastName,
        role: a.role,
        status: a.status,
      });
      instructorsOf.set(a.courseId, list);
    }
    return courses.map((c) => {
      const d = daysOf.get(c.id);
      return {
        id: c.id,
        courseType: {
          id: c.courseType.id,
          code: c.courseType.code,
          name: c.courseType.name,
          kind: c.courseType.kind,
          durationDays: c.courseType.durationDays,
        },
        location: {
          id: c.location.id,
          code: c.location.code,
          name: c.location.name,
        },
        language: c.language,
        status: c.status,
        capacity: c.capacity,
        booked: bookedOf.get(c.id) ?? 0,
        startsOn: d?.starts_on ?? null,
        endsOn: d?.ends_on ?? null,
        dayCount: d ? Number(d.day_count) : 0,
        isoWeek: d ? isoWeek(d.starts_on).week : null,
        instructors: instructorsOf.get(c.id) ?? [],
        planningRunId: c.planningRunId,
        planningIssue: c.planningIssue,
        externalRef: c.externalRef,
      };
    });
  }
}

function sortedDates(course: Course): IsoDate[] {
  return course.days.map((d) => d.heldOn).sort();
}

function activeAssignments(course: Course): Assignment[] {
  return course.assignments.filter((a) =>
    ACTIVE_ASSIGNMENTS.includes(a.status),
  );
}

/** «E2EA-UK Rupperswil KW 9», as the audit entries name a course. */
function courseLabel(course: Course): string {
  const dates = sortedDates(course);
  const week = dates.length ? `KW ${isoWeek(dates[0]).week}` : 'ohne Termin';
  return `${course.courseType.code} ${course.location.name} ${week}`;
}

export function toCourseToStaff(course: Course): CourseToStaff {
  return {
    id: course.id,
    courseTypeId: course.courseTypeId,
    locationId: course.locationId,
    language: course.language,
    cohortId: course.cohortId,
    dates: sortedDates(course),
    coInstructorIds: activeAssignments(course).map((a) => a.instructorId),
  };
}

function toCandidateView(
  candidate: Candidate,
  snap: PlanningSnapshot,
): CandidateView {
  const i = candidate.instructor;
  const home = snap.locations.get(i.homeLocationId);
  return {
    instructor: {
      id: i.id,
      firstName: i.firstName,
      lastName: i.lastName,
      employmentType: i.employmentType,
      homeLocation: {
        id: i.homeLocationId,
        code: home?.code ?? '',
        name: home?.name ?? '',
      },
    },
    result: candidate.result,
  };
}
