import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

export interface UserPreferences {
  push_notification_enabled: boolean
  email_notification_enabled: boolean
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "varchar", length: 100 })
  name: string

  @Column({ type: "varchar", length: 150, unique: true })
  email: string

  @Column({ type: "varchar", length: 255, select: false })
  password: string

  @Column({
    type: "json",
  })
  preferences: UserPreferences = {
    push_notification_enabled: false,
    email_notification_enabled: false,
  }

  @Column({ type: "json" })
  push_tokens: string[] = []

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
