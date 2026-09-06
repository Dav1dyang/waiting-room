// Every line the window ever says, in one place (PROTOCOL.md section 7).
// The lobby sends keys; the window renders these. Keep them short, deadpan, kind.
// Shared by the Durable Object (import) and the page (script type="module").

export const LINES = {
  entered: 'Stranger has entered the room.',
  hear: 'They can hear you. Say hi.',
  brb: 'brb, my Claude needs me',
  back: 'back',
  done_you: 'Your Claude is done. Closing in 5.',
  done_them: "Stranger's Claude is done. Leaving in 5.",
  left: 'Stranger has left the room.',
  requeued: 'Back in the queue.',
  video_on: 'Video is on.',
  quiet_claude: 'Your Claude went quiet. Closing.',
  quiet_room: 'Quiet room. Back in the queue.',
  time_up: 'Thirty minutes. Back in the queue.',
  reported: 'Reported. Leaving.',
  rehearsal: 'This is a test. Closing in 5.',
  done_alone: 'Your Claude is done.',
  off: 'waiting-room is off. Closing.',
};

/** The count line: always other people, never you (D-70). */
export function countLine(others) {
  if (others <= 0) return 'Nobody else is waiting right now. Your Claude is still working.';
  if (others === 1) return '1 other is waiting for their Claude.';
  return `${others} others are waiting for their Claude.`;
}

/** Labels on the window itself. */
export const UI = {
  title: 'Waiting Room',
  setupTitle: 'Waiting Room Setup',
  you: 'YOU',
  them: 'STRANGER',
  hangUp: 'Hang up',
  showVideo: 'Show video',
  hideVideo: 'Hide video',
  report: 'Report',
  sounds: 'Sounds',
  mute: 'Mute',
  live: 'live',
};

/** The setup page, top to bottom. */
export const SETUP = {
  intro: 'Set up once. From now on, when your Claude works for more than 15 s, a small shaded window opens by itself with the count. When a stranger arrives it unrolls, knocks, and you are talking. It closes when your Claude is done.',
  mic: 'Microphone allowed.',
  micSub: 'It turns on only when a stranger enters, never while you wait. Pick "Allow on every visit".',
  micBtn: 'Allow microphone',
  notif: 'Notifications allowed.',
  notifSub: 'The knock when a stranger arrives. The window opens behind your terminal, so this is how you notice.',
  notifBtn: 'Allow notifications',
  sound: 'Sound check.',
  soundSub: 'This is the door. It plays when a stranger enters, softer when someone leaves.',
  soundBtn: 'Play the door',
  rehearsal: 'Rehearsal.',
  rehearsalSub: 'Click, then send Claude any message. A test window opens behind the terminal and closes itself in 5 seconds.',
  rehearsalBtn: 'Arm a test window',
  rehearsalArmed: 'Armed. Now send Claude any message.',
  tint: 'Desktop tint.',
  rules: 'The rules. Audio first, video only when you both click. Nothing about your task is shared, ever. Nothing is recorded. Rooms end after 30 minutes. Be kind; Report is one click.',
  nobody: 'Nobody else is waiting right now. That is normal.',
  done: 'Done',
  badToken: 'This setup link is not valid. Run /waiting-room:on in Claude Code to get a fresh one.',
};

export const TINTS = [
  ['Pool', '#91CECF'],
  ['Shell', '#E6B1B2'],
  ['Mint', '#A7CDAB'],
  ['Dusk', '#BBBCE9'],
];
