import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './alert.entity.js';
import { AssistantConversation } from './assistant-conversation.entity.js';
import { AuditEntry } from './audit-entry.entity.js';
import { ImportBatch } from './import-batch.entity.js';
import { Setting } from './setting.entity.js';
import { ValidationIssue } from './validation-issue.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Alert,
      ImportBatch,
      ValidationIssue,
      AuditEntry,
      AssistantConversation,
      Setting,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class SystemModule {}
