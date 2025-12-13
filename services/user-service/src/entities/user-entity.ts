import {
  BeforeInsert,
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

  @Column({ type: "varchar", length: 100, nullable: false })
  name: string

  @Column({ type: "varchar", length: 150, unique: true, nullable: false })
  email: string

  @Column({ type: "varchar", length: 255, nullable: false, select: false })
  password: string

  @Column({
    type: "json",
  })
  preferences: UserPreferences

  @Column({ type: "json" })
  push_tokens: string[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @BeforeInsert()
  addDefaultPreferences() {
    if (!this.preferences) {
      this.preferences = {
        push_notification_enabled: false,
        email_notification_enabled: false,
      }
    }

    if (!this.push_tokens) {
      this.push_tokens = []
    }
  }
}
