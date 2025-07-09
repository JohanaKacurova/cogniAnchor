// Command handler interface and navigation command processor for the global voice assistant
import { router } from 'expo-router';

export interface CommandHandler {
  pattern: RegExp | string[];
  action: (params: { input: string; match?: RegExpMatchArray | null }) => Promise<void>;
  description: string;
  examples: string[];
}

// Map of screen names/aliases to routes
const screenRoutes: Record<string, string> = {
  'home': '/',
  'main': '/',
  'dashboard': '/',
  'calm zone': '/calm-zone',
  'schedule': '/schedule',
  'contacts': '/contacts',
  'profile': '/profile',
  'settings': '/settings',
  'puzzles': '/puzzle-levels',
  'shape puzzle': '/shape-puzzle',
  'pattern puzzle': '/puzzle-patterns',
  'color puzzle': '/puzzle-colors',
  'size puzzle': '/puzzle-sizes',
  'mind match': '/mind-match',
};

// Navigation command handler
const navigationHandler: CommandHandler = {
  pattern: /^(go to|navigate to|open|show) (.+)$/i,
  async action({ input, match }) {
    if (!match || !match[2]) return;
    const screen = match[2].toLowerCase().trim();
    const route = screenRoutes[screen];
    if (route) {
      router.push(route as any);
    } else {
      // Optionally: provide feedback for unknown screen
      // (Handled by context or TTS in the calling component)
    }
  },
  description: 'Navigate to different screens by name',
  examples: ['go to calm zone', 'open schedule', 'show contacts', 'navigate to puzzles'],
};

// Go back command handler
const goBackHandler: CommandHandler = {
  pattern: /^(go back|back|previous)$/i,
  async action() {
    router.back();
  },
  description: 'Go back to the previous screen',
  examples: ['go back', 'back', 'previous'],
};

// Home command handler
const homeHandler: CommandHandler = {
  pattern: /^(go home|home|main|dashboard)$/i,
  async action() {
    router.push('/');
  },
  description: 'Go to the home screen',
  examples: ['go home', 'home', 'main', 'dashboard'],
};

// Calm Zone command handlers
const calmZonePlayHandler: CommandHandler = {
  pattern: /^(play|start) (.+)$/i,
  async action({ input, match }) {
    // Example: play ocean waves, play piano lullaby
    // TODO: Integrate with Calm Zone context or event system
    // For now, just TTS feedback
    // You can use TTS here if needed, or trigger a callback
  },
  description: 'Play an audio track in Calm Zone by name',
  examples: ['play ocean waves', 'start piano lullaby', 'play forest birds'],
};

const calmZonePauseHandler: CommandHandler = {
  pattern: /^(pause|stop|end) (audio|music|track|sound)?$/i,
  async action() {
    // TODO: Integrate with Calm Zone audio controls
  },
  description: 'Pause or stop the current audio track',
  examples: ['pause', 'stop audio', 'end music'],
};

const calmZoneBreathingHandler: CommandHandler = {
  pattern: /^(start|begin|do) (breathing|breathing exercise)$/i,
  async action() {
    // TODO: Integrate with Calm Zone breathing exercise
  },
  description: 'Start the breathing exercise',
  examples: ['start breathing', 'begin breathing exercise', 'do breathing'],
};

const calmZoneShowPuzzlesHandler: CommandHandler = {
  pattern: /^(show|open|go to) (puzzles|puzzle activities)$/i,
  async action() {
    // TODO: Integrate with navigation to puzzles
  },
  description: 'Show puzzle activities in Calm Zone',
  examples: ['show puzzles', 'open puzzle activities', 'go to puzzles'],
};

const calmZoneVolumeHandler: CommandHandler = {
  pattern: /^(increase|decrease|set) volume( to)? (\d+)?$/i,
  async action({ input, match }) {
    // TODO: Integrate with Calm Zone volume controls
  },
  description: 'Adjust Calm Zone audio volume',
  examples: ['increase volume', 'decrease volume', 'set volume to 50'],
};

// Puzzle command handlers
const puzzleStartHandler: CommandHandler = {
  pattern: /^(start|begin|play) (shape|pattern|color|size|mind match) (puzzle|game)?$/i,
  async action({ input, match }) {
    // TODO: Integrate with navigation to puzzle screens
    // For now, just TTS feedback or navigation
  },
  description: 'Start a puzzle by type',
  examples: ['start shape puzzle', 'play color puzzle', 'begin mind match game'],
};

const puzzleResetHandler: CommandHandler = {
  pattern: /^(reset|restart|clear) (puzzle|game)?$/i,
  async action() {
    // TODO: Integrate with PuzzleContext reset
  },
  description: 'Reset the current puzzle',
  examples: ['reset puzzle', 'restart game', 'clear puzzle'],
};

const puzzleHintHandler: CommandHandler = {
  pattern: /^(hint|help|give me a hint|show hint)$/i,
  async action() {
    // TODO: Integrate with PuzzleContext hint system
  },
  description: 'Give a hint for the current puzzle',
  examples: ['hint', 'give me a hint', 'show hint'],
};

const puzzleProgressHandler: CommandHandler = {
  pattern: /^(progress|how am i doing|show progress)$/i,
  async action() {
    // TODO: Integrate with PuzzleContext progress reporting
  },
  description: 'Show progress in the current puzzle',
  examples: ['progress', 'how am I doing', 'show progress'],
};

const puzzleBackHandler: CommandHandler = {
  pattern: /^(go back to puzzles|back to puzzles|show puzzles)$/i,
  async action() {
    // TODO: Integrate with navigation to puzzle selection
  },
  description: 'Go back to puzzle selection',
  examples: ['go back to puzzles', 'back to puzzles', 'show puzzles'],
};

// Schedule command handlers
const scheduleAddHandler: CommandHandler = {
  pattern: /^(add|create|new) (appointment|event|reminder)( for)? (.+)?$/i,
  async action({ input, match }) {
    // TODO: Integrate with schedule creation flow
  },
  description: 'Add a new appointment, event, or reminder',
  examples: ['add appointment for tomorrow at 2 PM', 'create event for Friday', 'new reminder to take medicine'],
};

const scheduleShowHandler: CommandHandler = {
  pattern: /^(show|view|see) (today'?s|my)? (schedule|appointments|events)$/i,
  async action() {
    // TODO: Integrate with schedule viewing
  },
  description: "Show today's or upcoming schedule",
  examples: ["show today's schedule", 'view my appointments', 'see events'],
};

const scheduleRemindHandler: CommandHandler = {
  pattern: /^(remind me to) (.+)$/i,
  async action({ input, match }) {
    // TODO: Integrate with reminder creation
  },
  description: 'Create a quick reminder',
  examples: ['remind me to take medicine', 'remind me to call Sarah'],
};

// Contacts command handlers
const contactsShowHandler: CommandHandler = {
  pattern: /^(show|view|see) (contacts|family|friends|emergency|medical)$/i,
  async action({ input, match }) {
    // TODO: Integrate with contacts filtering
  },
  description: 'Show contacts or filter by category',
  examples: ['show contacts', 'view family', 'see emergency contacts'],
};

const contactsFindHandler: CommandHandler = {
  pattern: /^(find|search for|call) (.+)$/i,
  async action({ input, match }) {
    // TODO: Integrate with contact search or call
  },
  description: 'Find or call a contact by name',
  examples: ['find Sarah', 'search for Leo', 'call Dr. Smith'],
};

const contactsAddHandler: CommandHandler = {
  pattern: /^(add|create|new) contact( for)? (.+)?$/i,
  async action({ input, match }) {
    // TODO: Integrate with contact creation
  },
  description: 'Add a new contact',
  examples: ['add contact for John', 'create new contact'],
};

// Memory Lane command handlers
const memoryRecordHandler: CommandHandler = {
  pattern: /^(record|add|create|start) (memory|recording|voice note)$/i,
  async action() {
    // TODO: Integrate with memory recording
  },
  description: 'Record a new memory or voice note',
  examples: ['record memory', 'add voice note', 'start recording'],
};

const memoryPlayHandler: CommandHandler = {
  pattern: /^(play|listen to) (latest|my latest|[a-zA-Z0-9 ]+) (memory|recording|voice note)?$/i,
  async action({ input, match }) {
    // TODO: Integrate with memory playback
  },
  description: 'Play a memory or voice note',
  examples: ['play my latest memory', "listen to Sarah's recording"],
};

const memorySearchHandler: CommandHandler = {
  pattern: /^(search|find|show) (memories|memory|recordings|voice notes)( for)? (.+)?$/i,
  async action({ input, match }) {
    // TODO: Integrate with memory search/filter
  },
  description: 'Search or filter memories',
  examples: ['search memories for vacation', 'find family memories', 'show recordings'],
};

// Advanced feature handlers
const contextAwareSuggestionHandler: CommandHandler = {
  pattern: /^(what can i say|help|suggestions|what can i do)$/i,
  async action() {
    // TODO: Integrate with context-aware suggestion system
  },
  description: 'Provide context-aware command suggestions',
  examples: ['what can I say?', 'help', 'suggestions', 'what can I do?'],
};

const errorHandlingHandler: CommandHandler = {
  pattern: /^(repeat|try again|did you mean)$/i,
  async action() {
    // TODO: Integrate with error handling and fallback system
  },
  description: 'Handle recognition errors and ambiguous commands',
  examples: ['repeat', 'try again', 'did you mean'],
};

const accessibilityHandler: CommandHandler = {
  pattern: /^(activate accessibility|screen reader|high contrast|voice control)$/i,
  async action() {
    // TODO: Integrate with accessibility and voice assistant settings
  },
  description: 'Activate accessibility features or voice control',
  examples: ['activate accessibility', 'screen reader', 'high contrast', 'voice control'],
};

export const commandHandlers: CommandHandler[] = [
  navigationHandler,
  goBackHandler,
  homeHandler,
  calmZonePlayHandler,
  calmZonePauseHandler,
  calmZoneBreathingHandler,
  calmZoneShowPuzzlesHandler,
  calmZoneVolumeHandler,
  puzzleStartHandler,
  puzzleResetHandler,
  puzzleHintHandler,
  puzzleProgressHandler,
  puzzleBackHandler,
  scheduleAddHandler,
  scheduleShowHandler,
  scheduleRemindHandler,
  contactsShowHandler,
  contactsFindHandler,
  contactsAddHandler,
  memoryRecordHandler,
  memoryPlayHandler,
  memorySearchHandler,
  contextAwareSuggestionHandler,
  errorHandlingHandler,
  accessibilityHandler,
  // Add more handlers here
];

// Main command processor
export async function processVoiceCommand(input: string): Promise<{ handled: boolean; handler?: CommandHandler }> {
  for (const handler of commandHandlers) {
    if (handler.pattern instanceof RegExp) {
      const match = input.match(handler.pattern);
      if (match) {
        await handler.action({ input, match });
        return { handled: true, handler };
      }
    } else if (Array.isArray(handler.pattern)) {
      for (const phrase of handler.pattern) {
        if (input.toLowerCase().startsWith(phrase.toLowerCase())) {
          await handler.action({ input });
          return { handled: true, handler };
        }
      }
    }
  }
  return { handled: false };
} 