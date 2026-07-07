export type TwilioAudioNormalizationProfile = {
  channelLayout: "mono";
  highPassHz: number;
  inputSource: "twilio-gather-speech" | "twilio-recording" | "openai-realtime";
  notes: string;
  targetIntegratedLufs: number;
  truePeakDb: number;
};

export const CLINICFLOW_AUDIO_NORMALIZATION_PROFILE = {
  channelLayout: "mono",
  highPassHz: 80,
  inputSource: "twilio-gather-speech",
  notes:
    "Twilio Gather performs speech recognition before ClinicFlow receives text, so live Gather audio cannot be normalised by the app before Twilio STT. Recording/OpenAI transcription paths should apply this profile before recognition.",
  targetIntegratedLufs: -17,
  truePeakDb: -2,
} satisfies TwilioAudioNormalizationProfile;

export function buildFfmpegAudioNormalizationArgs(inputPath: string, outputPath: string) {
  return [
    "-y",
    "-i",
    inputPath,
    "-ac",
    "1",
    "-af",
    `highpass=f=${CLINICFLOW_AUDIO_NORMALIZATION_PROFILE.highPassHz},loudnorm=I=${CLINICFLOW_AUDIO_NORMALIZATION_PROFILE.targetIntegratedLufs}:TP=${CLINICFLOW_AUDIO_NORMALIZATION_PROFILE.truePeakDb}:LRA=7`,
    outputPath,
  ];
}

export function getTwilioAudioNormalizationProfile() {
  return CLINICFLOW_AUDIO_NORMALIZATION_PROFILE;
}
