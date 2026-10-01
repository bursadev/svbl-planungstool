import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { DEVICE_CATEGORY_ENUM, DeviceCategory } from '../database/enums.js';

/** Gerätetyp: a kind of equipment a course needs, e.g. forklift S or BM. */
@Entity()
export class DeviceType extends BaseEntity {
  @Column({ type: 'text', unique: true })
  code: string;

  @Column('text')
  name: string;

  @Column({
    type: 'enum',
    enum: DeviceCategory,
    enumName: DEVICE_CATEGORY_ENUM,
  })
  category: DeviceCategory;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
