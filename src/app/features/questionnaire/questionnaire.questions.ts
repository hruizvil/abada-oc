/**
 * Capoeira – Natural Potential Discovery Questionnaire.
 *
 * Source of truth: Professor Mosquito's PDF. All choice questions are
 * multi-select EXCEPT the three degree/rating scales (Q10, Q13, Q15), which are
 * single-select because picking several would be nonsensical. Q16 is capped at 5.
 * The "For Professor Use Only" section is intentionally NOT here — it never
 * appears on the student form.
 */

export type QuestionType = 'single' | 'multi' | 'scale' | 'text';

export interface Question {
  id: string;            // q1..q31 — also the sheet column key
  text: string;
  type: QuestionType;
  options?: string[];    // for single / multi / scale
  maxSelect?: number;    // multi only (Q16)
  allowOther?: boolean;  // adds an "Other: ___" write-in (Q22, Q26)
}

export interface Part {
  title: string;         // step title shown in the wizard
  questions: Question[];
}

export const QUESTIONNAIRE: Part[] = [
  {
    title: 'How You Move',
    questions: [
      { id: 'q1', type: 'multi', text: 'When you learn a new Capoeira movement, what comes most naturally to you?', options: [
        'I learn the movement quickly by watching someone',
        'I need to practice it several times before it feels natural',
        'I like to understand how and why the movement works',
        'I naturally change the movement and make it my own',
        'I pay more attention to how the movement looks and feels',
      ] },
      { id: 'q2', type: 'multi', text: 'What do you enjoy most during physical training?', options: [
        'Learning new movements', 'Playing the game', 'Helping or teaching others',
        'Moving freely and creatively', 'Improving movements I already know',
        'Challenging myself physically', 'Performing or demonstrating',
      ] },
      { id: 'q3', type: 'multi', text: 'When you are playing Capoeira, what do you naturally pay attention to most?', options: [
        'My own movements', 'Timing and rhythm', 'Finding opportunities to attack or counter',
        'The overall energy of the game', "My partner's movements", 'Distance and positioning',
        'Creating unexpected movements',
      ] },
    ],
  },
  {
    title: 'Your Natural Learning Style',
    questions: [
      { id: 'q4', type: 'multi', text: 'How do you learn best?', options: [
        'By watching', 'By listening', 'By figuring things out on my own',
        'By doing', 'By asking questions', 'By practicing with a partner',
      ] },
      { id: 'q5', type: 'multi', text: 'When something is difficult, what do you usually do?', options: [
        'Keep trying until I get it', 'Watch someone else and try again', 'Take a break and come back to it',
        'Ask for help', 'Try a different approach', 'Become frustrated but continue anyway',
      ] },
      { id: 'q6', type: 'multi', text: 'Which statement sounds most like you?', options: [
        'I like structure and clear instructions', 'I like challenges and competition',
        'I like being noticed and performing', 'I like freedom to explore',
        'I like working together with others', 'I prefer quietly working on my own',
      ] },
    ],
  },
  {
    title: 'Your Capoeira Game',
    questions: [
      { id: 'q7', type: 'multi', text: 'Which part of the Capoeira game feels most natural to you?', options: [
        'Attacking', 'Counterattacking', 'Creating combinations', 'Using deception', 'Adapting to my partner',
        'Defending', 'Escaping', 'Controlling distance', 'Keeping the rhythm',
      ] },
      { id: 'q8', type: 'multi', text: 'When your partner does something unexpected, what do you naturally do?', options: [
        'React quickly', 'Move away and create space', 'Improvise something different',
        'Get excited and try to respond creatively', 'Try to understand what they are doing',
        'Look for a counter', 'Become more cautious',
      ] },
      { id: 'q9', type: 'multi', text: 'How would you describe your natural style of playing?', options: [
        'Fast and energetic', 'Creative and unpredictable', 'Strong and powerful', 'Expressive and playful',
        'Calm and controlled', 'Technical and precise', 'Defensive and strategic', 'I am still discovering my style',
      ] },
    ],
  },
  {
    title: 'Music and Rhythm',
    questions: [
      { id: 'q10', type: 'single', text: 'How naturally do you feel rhythm?', options: [
        'Very naturally', 'Usually naturally', 'Sometimes', 'I have to concentrate on it', 'Rhythm is difficult for me',
      ] },
      { id: 'q11', type: 'multi', text: 'Which part of Capoeira music interests you most?', options: [
        'Singing', 'Rhythm', 'Learning songs', 'Understanding the meaning and history of the songs',
        'Clapping', 'Instruments', 'Creating songs', 'I am not particularly interested in music',
      ] },
      { id: 'q12', type: 'multi', text: 'If you hear a rhythm you have never heard before, what do you naturally want to do?', options: [
        'Follow it', 'Move to it', 'Experiment with it', 'Analyze it', 'Try to reproduce it',
        'Listen carefully before doing anything',
      ] },
    ],
  },
  {
    title: 'Creativity and Expression',
    questions: [
      { id: 'q13', type: 'single', text: 'How comfortable are you creating your own movement?', options: [
        'Very comfortable', 'Comfortable', 'Sometimes comfortable', 'I prefer movements I already know',
        'I feel uncomfortable improvising',
      ] },
      { id: 'q14', type: 'multi', text: 'When you have freedom to create, what happens?', options: [
        'I immediately start experimenting', 'I copy something I have seen and modify it',
        'I feel unsure about what to do', 'I combine things I already know', 'I need some direction first',
        'I become very creative',
      ] },
      { id: 'q15', type: 'scale', text: 'How important is personal expression to you in Capoeira?', options: [
        '1 – Not important', '2 – Slightly important', '3 – Moderately important',
        '4 – Very important', '5 – Extremely important',
      ] },
    ],
  },
  {
    title: 'Personal Strengths',
    questions: [
      { id: 'q16', type: 'multi', maxSelect: 5, text: 'Which qualities do you think are your strongest? (Choose up to 5)', options: [
        'Discipline', 'Courage', 'Focus', 'Musicality', 'Flexibility', 'Speed', 'Humor', 'Teamwork',
        'Adaptability', 'Observation', 'Patience', 'Creativity', 'Leadership', 'Coordination', 'Strength',
        'Intelligence', 'Communication', 'Determination', 'Confidence', 'Problem-solving',
      ] },
      { id: 'q17', type: 'text', text: 'Which quality would you most like to develop?' },
      { id: 'q18', type: 'multi', text: 'When you are part of a group, what role do you naturally take?', options: [
        'Leader', 'Observer', 'Teacher', 'Performer', 'Helper', 'Motivator', 'Problem-solver',
        'Quiet contributor', 'I adapt depending on the situation',
      ] },
    ],
  },
  {
    title: 'Challenge and Courage',
    questions: [
      { id: 'q19', type: 'multi', text: 'How do you feel when you are asked to do something you have never done before?', options: [
        'Excited', 'Nervous but willing', 'I usually avoid it', 'Curious', 'I prefer to watch first',
        'It depends on the challenge',
      ] },
      { id: 'q20', type: 'multi', text: 'How do you react when you make a mistake in front of other people?', options: [
        'I laugh and try again', 'I become embarrassed', 'I analyze what went wrong',
        'I immediately try to correct it', 'I get frustrated', "I don't worry about it",
      ] },
    ],
  },
  {
    title: 'Your Relationship with Capoeira',
    questions: [
      { id: 'q21', type: 'text', text: 'What do you enjoy most about Capoeira?' },
      { id: 'q22', type: 'multi', allowOther: true, text: 'What part of Capoeira do you feel most connected to?', options: [
        'Movement', 'Music', 'Community', 'Creativity', 'Teaching/helping others', 'The game',
        'Culture and history', 'Challenge', 'Self-expression', 'Performance',
      ] },
      { id: 'q23', type: 'text', text: 'What do you think you are naturally good at in Capoeira?' },
      { id: 'q24', type: 'text', text: 'What do other people tell you that you are good at?' },
      { id: 'q25', type: 'text', text: 'If you could become exceptionally good at ONE aspect of Capoeira, what would you choose?' },
    ],
  },
  {
    title: 'Your Future',
    questions: [
      { id: 'q26', type: 'multi', allowOther: true, text: 'What would you like Capoeira to help you become?', options: [
        'Stronger', 'More disciplined', 'More athletic', 'A better leader', 'More comfortable expressing myself',
        'I am not sure yet', 'More confident', 'More creative', 'More musical', 'A better communicator',
        'Better at working with others',
      ] },
      { id: 'q27', type: 'text', text: 'Imagine yourself five years from now. What would you like your Capoeira to look like?' },
    ],
  },
  {
    title: 'The Most Important Questions',
    questions: [
      { id: 'q28', type: 'text', text: 'What do you think you can do in Capoeira that comes naturally to you?' },
      { id: 'q29', type: 'text', text: 'What is something you do in Capoeira that feels difficult for you, but you still enjoy doing?' },
      { id: 'q30', type: 'text', text: 'If your Professor could help you develop ONE natural ability that you already have, what would you want it to be?' },
    ],
  },
  {
    title: 'And Finally…',
    questions: [
      { id: 'q31', type: 'text', text: 'If there were no limits and you could become anything you wanted through Capoeira, what would you want to become?' },
    ],
  },
];
