import { HttpClient } from "./client";
import type {
  SendEmailRequest,
  ScheduleEmailRequest,
  ScheduleEmailResponse,
} from "./types";

export class EmailsApi {
  constructor(private readonly http: HttpClient) {}

  send(body: SendEmailRequest) {
    return this.http.post<void>("/api/emails/send", { body });
  }

  schedule(body: ScheduleEmailRequest) {
    return this.http.post<ScheduleEmailResponse>("/api/emails/schedule", { body });
  }
}
