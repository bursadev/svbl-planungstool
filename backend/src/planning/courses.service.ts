import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
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
import { isoWeek } from './engine/calendar.js';
import type { IsoDate } from './engine/types.js';
import type { ListCoursesQuery } from './dto/course.dto.js';

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
