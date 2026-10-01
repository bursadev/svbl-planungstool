import {
  Check,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Timestamps } from '../database/base.entity.js';
import { CurriculumModule } from './curriculum-module.entity.js';

/** Dependency between ÜK modules: `module` requires `prerequisiteModule` first. */
@Entity()
@Check('"module_id" <> "prerequisite_module_id"')
export class CurriculumModulePrerequisite extends Timestamps {
  @PrimaryColumn('uuid')
  moduleId: string;

  @ManyToOne(() => CurriculumModule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: Relation<CurriculumModule>;

  @PrimaryColumn('uuid')
  prerequisiteModuleId: string;

  @ManyToOne(() => CurriculumModule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prerequisite_module_id' })
  prerequisiteModule: Relation<CurriculumModule>;
}
