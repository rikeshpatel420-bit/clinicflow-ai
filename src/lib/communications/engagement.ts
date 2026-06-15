export type EngagementSignal = {
  replied: boolean;
  booked: boolean;
  highIntent: boolean;
  minutesSinceLastContact: number;
  estimatedValue: number;
};

export function scoreEngagement(signal: EngagementSignal) {
  const reply = signal.replied ? 25 : 0;
  const booking = signal.booked ? 25 : 0;
  const intent = signal.highIntent ? 25 : 8;
  const recency = Math.max(0, 20 - Math.floor(signal.minutesSinceLastContact / 10));
  const value = Math.min(20, Math.floor(signal.estimatedValue / 100));
  return Math.min(100, reply + booking + intent + recency + value);
}

export function getCommunicationSla(minutesWaiting: number) {
  if (minutesWaiting > 60) return "breached";
  if (minutesWaiting > 30) return "at risk";
  return "on track";
}

