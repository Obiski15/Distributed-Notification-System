import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm"

export enum TemplateType {
  EMAIL = "EMAIL",
  PUSH = "PUSH",
}

@Entity("templates")
@Unique(["name", "version", "type"])
@Index(["name", "version"])
export class Template {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "varchar" })
  name: string

  @Column({
    type: "enum",
    enum: TemplateType,
    default: TemplateType.EMAIL,
  })
  type: TemplateType

  @Column({ type: "varchar", nullable: false })
  subject: string

  @Column({ type: "text", nullable: false })
  body: string

  @Column({ type: "varchar", nullable: true })
  image_url: string

  @Column({ type: "varchar", nullable: true })
  action_url: string

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any>

  @Column({ type: "int", nullable: false, default: 1 })
  version: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
