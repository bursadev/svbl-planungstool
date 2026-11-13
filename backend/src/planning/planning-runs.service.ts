import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { Enrollment } from '../apprentices/enrollment.entity.js';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import {
  Assignment,
  type AssignmentCheckResult,
} from '../courses/assignment.entity.js';
import { CourseDay } from '../courses/course-day.entity.js';
import { Course } from '../courses/course.entity.js';
import {
  AssignmentRole,
  AssignmentStatus,
  CourseStatus,
  DemandSource,
  DemandStatus,
  EnrollmentChannel,
  EnrollmentStatus,
  Language,
  PlanningRunStage,
  PlanningRunStatus,
} from '../database/enums.js';
import { AuditService } from '../system/audit.service.js';
import { DemandApprentice } from './demand-apprentice.entity.js';
import { Demand } from './demand.entity.js';
import type { CreatePlanningRunDto } from './dto/planning-run.dto.js';
import { addDays, isoWeek, schoolYearStart } from './engine/calendar.js';
import {
  compareGroups,
  generateDemand,
  mergeGroups,
  sizeCourses,
  type DemandGroup,
} from './engine/demand.js';
import { toCourseToStaff } from './courses.service.js';
import { Ledger } from './engine/ledger.js';
import { proposeCourses } from './engine/propose.js';
import { staffCourses } from './engine/staffing.js';
import { checkReadiness, VARIANT_MODULE_RE } from './engine/readiness.js';
import type {
  DemandSummary,
  IsoDate,
  ReadinessReport,
} from './engine/types.js';
import { PlanningRun } from './planning-run.entity.js';
import { SnapshotService } from './snapshot.service.js';

export interface PlanningRunCounts {
  demandGroups: number;
  apprentices: number;
  coursesNeeded: number;
  coursesProposed: number;
  coursesUnplannable: number;
  coursesStaffed: number;
  unassignedApprentices: number;
}

export interface PlanningRunView {
  id: string;
  label: string;
  periodStartsOn: IsoDate;
  periodEndsOn: IsoDate;
  stage: PlanningRun['stage'];
  status: PlanningRun['status'];
  readiness: ReadinessReport | null;
  demandSummary: DemandSummary | null;
  createdAt: Date;
  committedAt: Date | null;
  createdBy: string | null;
  counts: PlanningRunCounts;
}

/** One demand group of GET /planning-runs/:id/demand. */
export interface DemandView {
  id: string;
  cohort: { id: string; label: string };
  module: {
    id: string;
    code: string;
    name: string;
    semester: number;
    durationDays: number;
  };
  location: { id: string; code: string; name: string };
  language: Language;
  schoolWeekday: number | null;
  blockedWeekdays: number[];
  window: { startsOn: IsoDate; endsOn: IsoDate; fromTimeWindow: boolean };
  participantCount: number;
  memberCount: number;
  existingFreeSeats: number;
  coursesNeeded: number;
  note: string | null;
}

/** One draft course of GET /planning-runs/:id/courses. */
export interface RunCourseView {
  id: string;
  demandId: string | null;
  courseType: { id: string; code: string; name: string; durationDays: number };
  cohort: { id: string; label: string } | null;
  location: { id: string; code: string; name: string };
  language: Language;
  isoWeek: number | null;
  dates: IsoDate[];
  room: { id: string; name: string } | null;
  seats: number;
  booked: number;
  blockedWeekdays: number[];
  /** Why the course could not be placed; null for placed courses. */
  planningIssue: string | null;
  /** The slot's reasons («Raum T1 reserviert», «Schultag Mo ausgespart»). */
  reasons: string[];
  proposedInstructor: {
    assignmentId: string;
    id: string;
    firstName: string;
    lastName: string;
    score: number | null;
    why: string;
    candidateCount: number | null;
  } | null;
  staffingIssue: string | null;
}

/** Marks the staffing reason inside `course.notes` next to the slot reasons. */
export const STAFFING_NOTE = 'Besetzung: ';

/** The intake numbers above the list of runs. */
export interface PlanningOverview {
  activeApprentices: number;
  /** Active apprentices without an enrollment on a future course. */
  apprenticesWithoutFutureUk: number;
  /** ÜK courses in the next eight weeks without an instructor. */
  unstaffedCourses: number;
  /** (module, cohort) pairs of the running semester without a time window. */
  modulesWithoutTimeWindow: number;
}

const MAX_PERIOD_DAYS = 366;

function defaultLabel(startsOn: IsoDate): string {
  const year = Number(startsOn.slice(0, 4));
  const spring = Number(startsOn.slice(5, 7)) < 8;
  return `${spring ? 'Frühlingssemester' : 'Herbstsemester'} ${year}`;
}

interface CountRow {
  run_id: string;
  demand_groups: string;
  apprentices: string;
  courses_needed: string;
  courses_proposed: string;
  courses_unplannable: string;
  courses_staffed: string;
  unassigned: string;
}

@Injectable()
export class PlanningRunsService {
  constructor(
    @InjectRepository(PlanningRun)
    private readonly runs: Repository<PlanningRun>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(Demand) private readonly demands: Repository<Demand>,
    private readonly ds: DataSource,
    private readonly snapshots: SnapshotService,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<PlanningRunView[]> {
    const runs = await this.runs.find({
      relations: { createdByUser: true },
      order: { createdAt: 'DESC' },
    });
    const counts = await this.countsFor(runs.map((r) => r.id));
    return runs.map((run) => toView(run, counts.get(run.id)));
  }

  async get(id: string): Promise<PlanningRunView> {
    const run = await this.load(id);
    const counts = await this.countsFor([id]);
    return toView(run, counts.get(id));
  }

  /** Creates a draft run and stores the readiness check of its period. */
  async create(
    dto: CreatePlanningRunDto,
    actor: AuthUser,
  ): Promise<PlanningRunView> {
    if (dto.periodEndsOn < dto.periodStartsOn) {
      throw new BadRequestException('Das Enddatum liegt vor dem Startdatum.');
    }
    if (addDays(dto.periodStartsOn, MAX_PERIOD_DAYS) < dto.periodEndsOn) {
      throw new BadRequestException('Eine Periode dauert höchstens ein Jahr.');
    }
    const duplicate = await this.runs.findOneBy({
      periodStartsOn: dto.periodStartsOn,
      periodEndsOn: dto.periodEndsOn,
      status: Not(PlanningRunStatus.Discarded),
    });
    if (duplicate) {
      throw new ConflictException(
        `Für diese Periode existiert bereits der Planungslauf «${duplicate.label}».`,
      );
    }
    const snapshot = await this.snapshots.load({
      from: dto.periodStartsOn,
      to: dto.periodEndsOn,
    });
    const readiness = checkReadiness(snapshot, {
      startsOn: dto.periodStartsOn,
      endsOn: dto.periodEndsOn,
    });
    const run = this.runs.create({
      label: dto.label?.trim() || defaultLabel(dto.periodStartsOn),
      periodStartsOn: dto.periodStartsOn,
      periodEndsOn: dto.periodEndsOn,
      createdByUserId: actor.dbUserId,
      readiness,
    });
    await this.runs.save(run);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'planning_run',
      entityId: run.id,
      action: 'create',
      after: {
        label: run.label,
        periodStartsOn: run.periodStartsOn,
        periodEndsOn: run.periodEndsOn,
      },
      summary: `hat Planungslauf «${run.label}» angelegt`,
    });
    return this.get(run.id);
  }

  /** Deletes the run with its drafts: courses first (their FK is RESTRICT), then the run (demand and enrollments cascade). */
  async discard(id: string, actor: AuthUser): Promise<void> {
    const run = await this.load(id);
    if (run.status === PlanningRunStatus.Committed) {
      throw new ConflictException(
        'Ein übernommener Planungslauf kann nicht mehr verworfen werden.',
      );
    }
    await this.ds.transaction(async (em) => {
      await em.delete(Course, { planningRunId: id });
      await em.delete(PlanningRun, { id });
    });
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'planning_run',
      entityId: id,
      action: 'delete',
      before: {
        label: run.label,
        periodStartsOn: run.periodStartsOn,
        periodEndsOn: run.periodEndsOn,
      },
      summary: `hat Planungslauf «${run.label}» verworfen`,
    });
  }

  async overview(
    today: IsoDate = new Date().toISOString().slice(0, 10),
  ): Promise<PlanningOverview> {
    const schoolYear = schoolYearStart(today);
    const semesterOffset = Number(today.slice(5, 7)) < 8 ? 2 : 1;
    const [[active], [withoutUk], [unstaffed], [windows]] = await Promise.all([
      this.ds.query(
        `SELECT COUNT(*)::int AS n FROM apprentice WHERE status = 'active'`,
      ) as Promise<{ n: number }[]>,
      this.ds.query(
        `SELECT COUNT(*)::int AS n FROM apprentice a
         WHERE a.status = 'active' AND NOT EXISTS (
           SELECT 1 FROM enrollment e JOIN course c ON c.id = e.course_id
           WHERE e.apprentice_id = a.id AND e.status IN ('registered', 'confirmed') AND c.status <> 'cancelled'
             AND (SELECT MIN(d.held_on) FROM course_day d WHERE d.course_id = c.id) >= $1)`,
        [today],
      ) as Promise<{ n: number }[]>,
      this.ds.query(
        `SELECT COUNT(*)::int AS n FROM course c JOIN course_type ct ON ct.id = c.course_type_id
         WHERE ct.kind = 'uk' AND c.status IN ('planned', 'confirmed', 'open')
           AND (SELECT MIN(d.held_on) FROM course_day d WHERE d.course_id = c.id) BETWEEN $1 AND $2
           AND NOT EXISTS (SELECT 1 FROM assignment a WHERE a.course_id = c.id AND a.status IN ('proposed', 'confirmed'))`,
        [today, addDays(today, 56)],
      ) as Promise<{ n: number }[]>,
      this.ds.query(
        `SELECT COUNT(*)::int AS n FROM curriculum_module cm
         JOIN course_type ct ON ct.id = cm.course_type_id
         JOIN cohort co ON co.track = cm.track AND cm.semester = 2 * ($1 - co.start_year) + $2
         WHERE cm.active AND ct.code !~ $3
           AND EXISTS (SELECT 1 FROM apprentice a WHERE a.cohort_id = co.id AND a.status = 'active')
           AND NOT EXISTS (SELECT 1 FROM time_window w WHERE w.curriculum_module_id = cm.id AND w.cohort_id = co.id)`,
        [
          schoolYear,
          semesterOffset,
          VARIANT_MODULE_RE.source.replace('\\b', '\\M'),
        ],
      ) as Promise<{ n: number }[]>,
    ]);
    return {
      activeApprentices: active.n,
      apprenticesWithoutFutureUk: withoutUk.n,
      unstaffedCourses: unstaffed.n,
      modulesWithoutTimeWindow: windows.n,
    };
  }

  // --- Stage 1: demand ------------------------------------------------------

  /**
   * Replaces the run's demand (and every later draft) with the groups the
   * engine derives from the cohorts, the curriculum and the school days.
   */
  async generateDemand(id: string, actor: AuthUser): Promise<DemandView[]> {
    const run = await this.loadDraft(id);
    const period = { startsOn: run.periodStartsOn, endsOn: run.periodEndsOn };
    const snapshot = await this.snapshots.load({
      from: period.startsOn,
      to: period.endsOn,
    });
    const result = generateDemand(snapshot, period);
    const groups = mergeGroups(result.groups, snapshot);
    const summary: DemandSummary = {
      generatedAt: new Date().toISOString(),
      catchUps: result.catchUps,
      skippedVariantModules: result.skippedVariantModules,
      apprenticesWithoutClass: result.apprenticesWithoutClass,
    };
    await this.ds.transaction(async (em) => {
      await em.delete(Course, { planningRunId: id });
      await em.delete(Enrollment, { planningRunId: id });
      await em.delete(Demand, { planningRunId: id });
      for (const group of groups) {
        const demand = em.create(Demand, {
          planningRunId: id,
          cohortId: group.cohortId,
          curriculumModuleId: group.moduleId,
          courseTypeId: group.courseTypeId,
          timeWindowId: group.timeWindowId,
          locationId: group.locationId,
          language: group.language,
          schoolWeekday: group.blockedWeekdays[0] ?? null,
          blockedWeekdays: group.blockedWeekdays,
          participantCount: group.participantCount,
          coursesNeeded: group.coursesNeeded,
          existingFreeSeats: group.existingFreeSeats,
          source: DemandSource.SchoolImport,
          status: DemandStatus.Open,
          note: group.notes.join(' · ') || null,
        });
        await em.save(demand);
        if (group.memberIds.length) {
          await em.insert(
            DemandApprentice,
            group.memberIds.map((apprenticeId) => ({
              demandId: demand.id,
              apprenticeId,
            })),
          );
        }
      }
      await em.update(
        PlanningRun,
        { id },
        { stage: PlanningRunStage.Demand, demandSummary: summary },
      );
    });
    const coursesNeeded = groups.reduce((n, g) => n + g.coursesNeeded, 0);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'planning_run',
      entityId: id,
      action: 'demand',
      after: { groups: groups.length, coursesNeeded, ...summary },
      summary: `hat den Bedarf für Planungslauf «${run.label}» erzeugt (${groups.length} Gruppen, ${coursesNeeded} Kurse)`,
    });
    return this.listDemand(id);
  }

  async listDemand(id: string): Promise<DemandView[]> {
    const run = await this.load(id);
    const demands = await this.demands.find({
      where: { planningRunId: id },
      relations: {
        cohort: true,
        curriculumModule: { courseType: true },
        location: true,
        timeWindow: true,
      },
    });
    const members: { demand_id: string; n: string }[] = demands.length
      ? await this.ds.query(
          `SELECT demand_id, COUNT(*) AS n FROM demand_apprentice WHERE demand_id = ANY($1) GROUP BY demand_id`,
          [demands.map((d) => d.id)],
        )
      : [];
    const memberCount = new Map(members.map((m) => [m.demand_id, Number(m.n)]));
    return demands
      .map((d) => ({
        id: d.id,
        cohort: { id: d.cohort!.id, label: d.cohort!.label },
        module: {
          id: d.curriculumModule!.id,
          code: d.curriculumModule!.courseType.code,
          name: d.curriculumModule!.courseType.name,
          semester: d.curriculumModule!.semester,
          durationDays: d.curriculumModule!.courseType.durationDays,
        },
        location: {
          id: d.location.id,
          code: d.location.code,
          name: d.location.name,
        },
        language: d.language,
        schoolWeekday: d.schoolWeekday,
        blockedWeekdays: d.blockedWeekdays,
        window: d.timeWindow
          ? {
              startsOn: d.timeWindow.startsOn,
              endsOn: d.timeWindow.endsOn,
              fromTimeWindow: true,
            }
          : {
              startsOn: run.periodStartsOn,
              endsOn: run.periodEndsOn,
              fromTimeWindow: false,
            },
        participantCount: d.participantCount,
        memberCount: memberCount.get(d.id) ?? 0,
        existingFreeSeats: d.existingFreeSeats,
        coursesNeeded: d.coursesNeeded,
        note: d.note,
      }))
      .sort(
        (a, b) =>
          a.cohort.label.localeCompare(b.cohort.label) ||
          a.module.semester - b.module.semester ||
          a.module.code.localeCompare(b.module.code) ||
          a.location.code.localeCompare(b.location.code) ||
          a.language.localeCompare(b.language) ||
          a.blockedWeekdays
            .join('+')
            .localeCompare(b.blockedWeekdays.join('+')),
      );
  }

  // --- Stage 2: courses and dates ---------------------------------------------

  /**
   * Replaces the run's draft courses: every demand group gets its courses
   * placed by the engine (dates, room), the members are packed into them
   * (or into existing courses with free seats) as draft enrollments.
   */
  async proposeCourses(id: string, actor: AuthUser): Promise<RunCourseView[]> {
    const run = await this.loadDraft(id);
    const demands = await this.demands.find({
      where: { planningRunId: id },
      relations: { members: true, timeWindow: true },
    });
    if (demands.length === 0)
      throw new ConflictException('Zuerst den Bedarf erzeugen.');
    const period = { startsOn: run.periodStartsOn, endsOn: run.periodEndsOn };
    // Earlier drafts of this run go first, so the snapshot does not see them.
    await this.ds.transaction(async (em) => {
      await em.delete(Course, { planningRunId: id });
      await em.delete(Enrollment, { planningRunId: id });
    });
    const snapshot = await this.snapshots.load({
      from: period.startsOn,
      to: period.endsOn,
    });
    const groups: DemandGroup[] = demands
      .map((d) => {
        const type = snapshot.courseTypes.get(d.courseTypeId);
        return {
          key: d.id,
          cohortId: d.cohortId ?? '',
          moduleId: d.curriculumModuleId ?? '',
          courseTypeId: d.courseTypeId,
          timeWindowId: d.timeWindowId,
          window: d.timeWindow
            ? { startsOn: d.timeWindow.startsOn, endsOn: d.timeWindow.endsOn }
            : period,
          locationId: d.locationId,
          language: d.language,
          blockedWeekdays: d.blockedWeekdays,
          memberIds: d.members.map((m) => m.apprenticeId).sort(),
          classIds: [],
          existingFreeSeats: d.existingFreeSeats,
          participantCount: d.participantCount,
          coursesNeeded: d.coursesNeeded,
          sizes: sizeCourses(
            d.participantCount,
            type?.maxParticipants ?? 12,
            type?.minParticipants ?? null,
          ),
          notes: [],
        };
      })
      .sort((a, b) => compareGroups(snapshot, a, b));
    const ctx = {
      snapshot,
      ledger: Ledger.fromSnapshot(snapshot),
      today: snapshot.asOf,
    };
    const soonest = addDays(snapshot.asOf, 7);
    const result = proposeCourses(groups, ctx, {
      notBefore: soonest > period.startsOn ? soonest : period.startsOn,
    });
    await this.ds.transaction(async (em) => {
      const idOf = new Map<string, string>();
      for (const c of result.courses) {
        const course = em.create(Course, {
          courseTypeId: c.courseTypeId,
          locationId: c.locationId,
          language: c.language,
          cohortId: c.cohortId || null,
          timeWindowId: c.timeWindowId,
          demandId: c.demandKey,
          planningRunId: id,
          capacity: c.seats,
          status: CourseStatus.Demand,
          planningIssue: c.issue,
          notes: c.reasons.length ? c.reasons.join(' · ') : null,
          createdByUserId: actor.dbUserId,
        });
        await em.save(course);
        idOf.set(c.key, course.id);
        if (c.dates.length) {
          await em.insert(
            CourseDay,
            c.dates.map((heldOn, i) => ({
              courseId: course.id,
              heldOn,
              startsAt: '08:15',
              endsAt: '16:45',
              sequence: i + 1,
              roomId: c.roomId,
            })),
          );
        }
      }
      const enrollments = result.placements.map((p) => ({
        courseId: p.courseKey ? idOf.get(p.courseKey)! : p.existingCourseId!,
        apprenticeId: p.apprenticeId,
        status: EnrollmentStatus.Registered,
        enrolledVia: EnrollmentChannel.Planner,
        enrolledByUserId: actor.dbUserId,
        planningRunId: id,
      }));
      for (let i = 0; i < enrollments.length; i += 500) {
        await em.insert(Enrollment, enrollments.slice(i, i + 500));
      }
      await em.update(PlanningRun, { id }, { stage: PlanningRunStage.Courses });
    });
    const placed = result.courses.filter((c) => c.issue === null).length;
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'planning_run',
      entityId: id,
      action: 'courses',
      after: {
        courses: result.courses.length,
        placed,
        unplannable: result.courses.length - placed,
        placements: result.placements.length,
        unassigned: result.unassigned.length,
      },
      summary: `hat für Planungslauf «${run.label}» ${result.courses.length} Kurse vorgeschlagen (${result.courses.length - placed} nicht planbar, ${result.unassigned.length} Lernende ohne Platz)`,
    });
    return this.listRunCourses(id);
  }

  async listRunCourses(id: string): Promise<RunCourseView[]> {
    await this.load(id);
    const courses = await this.courses.find({
      where: { planningRunId: id },
      relations: {
        courseType: true,
        location: true,
        cohort: true,
        days: { room: true },
        assignments: { instructor: true },
        demand: { curriculumModule: true },
      },
    });
    const booked: { course_id: string; n: string }[] = courses.length
      ? await this.ds.query(
          `SELECT course_id, COUNT(*) AS n FROM enrollment
           WHERE course_id = ANY($1) AND status IN ('registered', 'confirmed') GROUP BY course_id`,
          [courses.map((c) => c.id)],
        )
      : [];
    const bookedOf = new Map(booked.map((b) => [b.course_id, Number(b.n)]));
    return courses
      .map((c): RunCourseView => {
        const days = [...c.days].sort((a, b) =>
          a.heldOn.localeCompare(b.heldOn),
        );
        const notes = (c.notes ?? '').split(' · ').filter(Boolean);
        const staffing = notes.find((n) => n.startsWith(STAFFING_NOTE));
        const assignment = c.assignments.find(
          (a) =>
            a.status === AssignmentStatus.Proposed ||
            a.status === AssignmentStatus.Confirmed,
        );
        return {
          id: c.id,
          demandId: c.demandId,
          courseType: {
            id: c.courseType.id,
            code: c.courseType.code,
            name: c.courseType.name,
            durationDays: c.courseType.durationDays,
          },
          cohort: c.cohort ? { id: c.cohort.id, label: c.cohort.label } : null,
          location: {
            id: c.location.id,
            code: c.location.code,
            name: c.location.name,
          },
          language: c.language,
          isoWeek: days.length ? isoWeek(days[0].heldOn).week : null,
          dates: days.map((d) => d.heldOn),
          room: days[0]?.room
            ? { id: days[0].room.id, name: days[0].room.name }
            : null,
          seats: c.capacity,
          booked: bookedOf.get(c.id) ?? 0,
          blockedWeekdays: c.demand?.blockedWeekdays ?? [],
          planningIssue: c.planningIssue,
          reasons: notes.filter((n) => !n.startsWith(STAFFING_NOTE)),
          proposedInstructor: assignment
            ? {
                assignmentId: assignment.id,
                id: assignment.instructor.id,
                firstName: assignment.instructor.firstName,
                lastName: assignment.instructor.lastName,
                score: assignment.score,
                why: whyOf(assignment.checkResult),
                candidateCount: candidateCountOf(assignment.note),
              }
            : null,
          staffingIssue: staffing ? staffing.slice(STAFFING_NOTE.length) : null,
        };
      })
      .sort(
        (a, b) =>
          (a.cohort?.label ?? '').localeCompare(b.cohort?.label ?? '') ||
          a.courseType.code.localeCompare(b.courseType.code) ||
          a.location.code.localeCompare(b.location.code) ||
          (a.dates[0] ?? '9999').localeCompare(b.dates[0] ?? '9999') ||
          a.id.localeCompare(b.id),
      );
  }

  // --- Stage 3: instructors ----------------------------------------------------

  /**
   * Replaces the proposed assignments of the run's draft courses with the
   * engine's staffing (most constrained first, 2-swap improvement). Courses
   * nobody can teach keep the reason in their notes (`Besetzung: …`).
   */
  async staffRun(id: string, actor: AuthUser): Promise<RunCourseView[]> {
    const run = await this.loadDraft(id);
    const drafts = await this.courses.find({
      where: { planningRunId: id },
      relations: {
        courseType: true,
        location: true,
        days: true,
        assignments: true,
      },
    });
    if (drafts.length === 0)
      throw new ConflictException('Zuerst die Kurse vorschlagen.');
    const draftIds = drafts.map((c) => c.id);
    await this.ds.transaction(async (em) => {
      await em
        .createQueryBuilder()
        .delete()
        .from(Assignment)
        .where('course_id = ANY(:ids) AND status = :status', {
          ids: draftIds,
          status: AssignmentStatus.Proposed,
        })
        .execute();
      for (const course of drafts) {
        const kept = (course.notes ?? '')
          .split(' · ')
          .filter((n) => n && !n.startsWith(STAFFING_NOTE));
        course.notes = kept.length ? kept.join(' · ') : null;
        course.assignments = course.assignments.filter(
          (a) => a.status !== AssignmentStatus.Proposed,
        );
        await em.update(Course, { id: course.id }, { notes: course.notes });
      }
    });
    const snapshot = await this.snapshots.load(
      { from: run.periodStartsOn, to: run.periodEndsOn },
      { includeApprentices: false },
    );
    const ctx = {
      snapshot,
      ledger: Ledger.fromSnapshot(snapshot),
      today: snapshot.asOf,
    };
    const placed = drafts
      .filter((c) => c.days.length > 0)
      .sort((a, b) => a.id.localeCompare(b.id));
    const result = staffCourses(placed.map(toCourseToStaff), ctx);
    await this.ds.transaction(async (em) => {
      for (const s of result.staffed) {
        await em.insert(Assignment, {
          courseId: s.courseId,
          instructorId: s.instructorId,
          role: AssignmentRole.Lead,
          status: AssignmentStatus.Proposed,
          checkResult: s.result,
          score: s.result.score,
          note: `${s.candidateCount} machbare Kandidaten`,
        });
      }
      for (const u of result.unstaffed) {
        const course = placed.find((c) => c.id === u.courseId)!;
        const notes = [
          ...(course.notes ?? '').split(' · ').filter(Boolean),
          `${STAFFING_NOTE}${u.reason}`,
        ];
        await em.update(
          Course,
          { id: u.courseId },
          { notes: notes.join(' · ') },
        );
      }
      await em.update(
        PlanningRun,
        { id },
        { stage: PlanningRunStage.Staffing },
      );
    });
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'planning_run',
      entityId: id,
      action: 'staffing',
      after: {
        staffed: result.staffed.length,
        unstaffed: result.unstaffed.length,
      },
      summary: `hat für Planungslauf «${run.label}» ${result.staffed.length} Kurse besetzt (${result.unstaffed.length} ohne machbaren Ausbilder)`,
    });
    return this.listRunCourses(id);
  }

  /** The run, or 409 when it is no longer a draft. */
  async loadDraft(id: string): Promise<PlanningRun> {
    const run = await this.load(id);
    if (run.status !== PlanningRunStatus.Draft) {
      throw new ConflictException(
        'Der Planungslauf ist bereits übernommen oder verworfen.',
      );
    }
    return run;
  }

  async load(id: string): Promise<PlanningRun> {
    const run = await this.runs.findOne({
      where: { id },
      relations: { createdByUser: true },
    });
    if (!run) throw new NotFoundException('Planungslauf nicht gefunden.');
    return run;
  }

  private async countsFor(
    ids: string[],
  ): Promise<Map<string, PlanningRunCounts>> {
    if (ids.length === 0) return new Map();
    const rows: CountRow[] = await this.ds.query(
      `SELECT r.id AS run_id,
              (SELECT COUNT(*) FROM demand d WHERE d.planning_run_id = r.id) AS demand_groups,
              (SELECT COUNT(DISTINCT da.apprentice_id) FROM demand d JOIN demand_apprentice da ON da.demand_id = d.id
                WHERE d.planning_run_id = r.id) AS apprentices,
              (SELECT COALESCE(SUM(d.courses_needed), 0) FROM demand d WHERE d.planning_run_id = r.id) AS courses_needed,
              (SELECT COUNT(*) FROM course c WHERE c.planning_run_id = r.id
                AND EXISTS (SELECT 1 FROM course_day cd WHERE cd.course_id = c.id)) AS courses_proposed,
              (SELECT COUNT(*) FROM course c WHERE c.planning_run_id = r.id
                AND NOT EXISTS (SELECT 1 FROM course_day cd WHERE cd.course_id = c.id)) AS courses_unplannable,
              (SELECT COUNT(*) FROM course c WHERE c.planning_run_id = r.id
                AND EXISTS (SELECT 1 FROM assignment a WHERE a.course_id = c.id AND a.status IN ('proposed', 'confirmed'))) AS courses_staffed,
              (SELECT COUNT(DISTINCT da.apprentice_id) FROM demand d JOIN demand_apprentice da ON da.demand_id = d.id
                WHERE d.planning_run_id = r.id
                  AND EXISTS (SELECT 1 FROM course c WHERE c.planning_run_id = r.id)
                  AND NOT EXISTS (SELECT 1 FROM enrollment e WHERE e.planning_run_id = r.id AND e.apprentice_id = da.apprentice_id)) AS unassigned
       FROM planning_run r WHERE r.id = ANY($1)`,
      [ids],
    );
    return new Map(
      rows.map((row) => [
        row.run_id,
        {
          demandGroups: Number(row.demand_groups),
          apprentices: Number(row.apprentices),
          coursesNeeded: Number(row.courses_needed),
          coursesProposed: Number(row.courses_proposed),
          coursesUnplannable: Number(row.courses_unplannable),
          coursesStaffed: Number(row.courses_staffed),
          unassignedApprentices: Number(row.unassigned),
        },
      ]),
    );
  }
}

const EMPTY_COUNTS: PlanningRunCounts = {
  demandGroups: 0,
  apprentices: 0,
  coursesNeeded: 0,
  coursesProposed: 0,
  coursesUnplannable: 0,
  coursesStaffed: 0,
  unassignedApprentices: 0,
};

function toView(
  run: PlanningRun,
  counts: PlanningRunCounts | undefined,
): PlanningRunView {
  return {
    id: run.id,
    label: run.label,
    periodStartsOn: run.periodStartsOn,
    periodEndsOn: run.periodEndsOn,
    stage: run.stage,
    status: run.status,
    readiness: run.readiness,
    demandSummary: run.demandSummary,
    createdAt: run.createdAt,
    committedAt: run.committedAt,
    createdBy: run.createdByUser?.displayName ?? null,
    counts: counts ?? EMPTY_COUNTS,
  };
}

/** The first two positive soft reasons without their «(+n)» suffix. */
function whyOf(result: AssignmentCheckResult | null): string {
  if (!result) return '';
  return result.soft
    .filter((s) => s.delta > 0)
    .slice(0, 2)
    .map((s) => s.text.replace(/\s\(.*\)$/, ''))
    .join(' · ');
}

/** `assignment.note` of the staffing stage reads «n machbare Kandidaten». */
function candidateCountOf(note: string | null): number | null {
  const match = note ? /^(\d+) machbare/.exec(note) : null;
  return match ? Number(match[1]) : null;
}
