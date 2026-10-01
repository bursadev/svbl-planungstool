import { NotFoundException, ParseUUIDPipe } from '@nestjs/common';

/** Route ids must be uuids; anything else is simply "not found". */
export const uuidPipe = new ParseUUIDPipe({
  exceptionFactory: () => new NotFoundException('Nicht gefunden.'),
});
