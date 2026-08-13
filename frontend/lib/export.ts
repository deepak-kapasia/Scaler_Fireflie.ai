import type { MeetingDetail, TranscriptSegment } from "@/types";
import { secondsToTimestamp, formatDate, formatDurationLabel } from "./utils";

function generateUnifiedText(meeting: MeetingDetail, transcript: TranscriptSegment[], isMarkdown: boolean) {
  const nl = "\n";
  const h1 = isMarkdown ? "# " : "";
  const h2 = isMarkdown ? "## " : "";
  const bold = isMarkdown ? "**" : "";
  const li = isMarkdown ? "- " : "* ";

  let out = `${h1}${meeting.title}${nl}`;
  out += `Date: ${formatDate(meeting.date)}${nl}`;
  out += `Duration: ${formatDurationLabel(meeting.duration_seconds)}${nl}`;
  out += `Participants: ${meeting.participants.map(p => p.name).join(", ")}${nl}${nl}`;

  if (meeting.summary) {
    out += `${h2}AI Summary${nl}`;
    out += `${bold}Overview:${bold}${nl}${meeting.summary.overview}${nl}${nl}`;
    
    if (meeting.summary.key_topics.length > 0) {
      out += `${bold}Key Topics:${bold}${nl}`;
      meeting.summary.key_topics.forEach(t => {
        out += `${li}${t.topic}${nl}`;
      });
      out += nl;
    }
  }

  if (meeting.action_items && meeting.action_items.length > 0) {
    out += `${h2}Action Items${nl}`;
    meeting.action_items.forEach(a => {
      out += `${li}[${a.is_completed ? "x" : " "}] ${a.text} (Assigned to: ${a.assignee_name})${nl}`;
    });
    out += nl;
  }

  out += `${h2}Transcript${nl}`;
  if (transcript.length === 0) {
    out += `No transcript available.${nl}`;
  } else {
    transcript.forEach(seg => {
      out += `[${secondsToTimestamp(seg.start_time)}] ${bold}${seg.speaker_name}${bold}:${nl}${seg.text}${nl}${nl}`;
    });
  }

  return out;
}

export function downloadMeetingAs(format: "txt" | "md", meeting: MeetingDetail, transcript: TranscriptSegment[]) {
  const content = generateUnifiedText(meeting, transcript, format === "md");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
