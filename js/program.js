// EZ LIFE STYLE TRACKER — training content.
// Sessions A–E, P1–P14, C1–C7, BB1–BB10 and Emergency Home 1–3 keep the original
// protocol prescriptions verbatim; the rest are additions. Items flagged p:true are
// power work: do them right after the warm-up, before heavy strength.

const GYM_WARMUP = '10–15 min: 3 min easy bike/skip → hips, ankles, T-spine mobility → glute bridge + band pull-apart → 2–3 ramp-up sets of the first lift.';

export const GYM = [
  { code: 'A', name: 'Acceleration + Trap Bar', focus: 'Acceleration, force production and unilateral strength', warmup: GYM_WARMUP, parts: [
    { title: 'Part 1 — Gym', items: [
      { n: 'Trap-bar deadlift', d: '4 × 4 · RPE 7–8; fast concentric' },
      { n: 'DB bench press', d: '4 × 6 · RPE 7–8' },
      { n: 'Assisted pull-up', d: '4 × 5–8 · progress toward first strict rep' },
      { n: 'RF-elevated split squat', d: '3 × 8/leg · 2–3 sec lower' },
      { n: 'Chest-supported row', d: '3 × 10 · pause at ribs' },
      { n: 'Single-leg RDL', d: '3 × 8/leg · balance + hamstrings' }] },
    { title: 'Part 2 — Athletic', items: [
      { n: 'Countermovement jump', d: '4 × 3', p: true },
      { n: 'Low pogo', d: '2 × 20', p: true },
      { n: 'Hang high pull', d: '3 × 3 · RPE 6–7 · technique first', p: true },
      { n: 'Farmer carry', d: '3 × 30–40 m' }] },
    { title: 'Part 3 — Core & Cooldown', items: [
      { n: 'Soleus calf iso', d: '2 × 30–45 sec/side' },
      { n: 'Copenhagen plank', d: '2 × 20–30 sec/side' },
      { n: 'Neck flexion iso', d: '2 × 15–20 sec, pain-free' },
      { n: 'Hanging knee raise', d: '3 × 8–12' },
      { n: 'Dead bug', d: '2 × 8/side' },
      { n: 'Easy nasal breathing', d: '2 min' }] }] },

  { code: 'B', name: 'Upper Power + Front-Leg Strength', focus: 'Upper-body power and speed-strength', warmup: GYM_WARMUP, parts: [
    { title: 'Part 1 — Gym', items: [
      { n: 'Front-foot elevated reverse lunge', d: '4 × 6/leg · RPE 7–8' },
      { n: 'Bench press', d: '4 × 5 · RPE 7–8' },
      { n: 'Assisted pull-up', d: '4 × 5–8 · controlled' },
      { n: 'Landmine press', d: '3 × 8/side · ribs down' },
      { n: 'Cable row', d: '3 × 10 · full scapular movement' },
      { n: 'Hamstring curl', d: '3 × 10 · controlled' }] },
    { title: 'Part 2 — Athletic', items: [
      { n: 'Med-ball chest pass', d: '4 × 4', p: true },
      { n: 'Pogo', d: '2 × 20', p: true },
      { n: 'Hang high pull', d: '3 × 3 · RPE 6–7', p: true },
      { n: 'Suitcase carry', d: '3 × 25–30 m/side' }] },
    { title: 'Part 3 — Core & Cooldown', items: [
      { n: 'Spanish squat iso', d: '3 × 30–45 sec' },
      { n: 'Hamstring bridge iso', d: '2 × 30 sec' },
      { n: 'Neck lateral iso', d: '2 × 15–20 sec/side' },
      { n: 'Ab wheel', d: '3 × 6–10' },
      { n: 'Side plank', d: '2 × 30–45 sec/side' },
      { n: 'Hip flexor mobility', d: '2 min' }] }] },

  { code: 'C', name: 'Deceleration + Posterior Chain', focus: 'Braking, hinge strength and lateral control', warmup: GYM_WARMUP, parts: [
    { title: 'Part 1 — Gym', items: [
      { n: 'Romanian deadlift', d: '4 × 6 · RPE 7–8; 2–3 sec lower' },
      { n: 'Incline DB press', d: '4 × 6–8 · RPE 7–8' },
      { n: 'Step-up', d: '3 × 8/leg · drive through full foot' },
      { n: 'Chest-supported row', d: '3 × 8–10 · heavy, strict' },
      { n: 'DB shoulder press', d: '3 × 8 · no grinding' },
      { n: 'Hip thrust', d: '3 × 8 · 2 sec lockout' }] },
    { title: 'Part 2 — Athletic', items: [
      { n: 'Lateral bound', d: '3 × 4/side', p: true },
      { n: 'Broad jump', d: '4 × 2', p: true },
      { n: 'Low-volume clean pull', d: '3 × 3 · RPE 6–7', p: true },
      { n: 'Farmer carry', d: '3 × 30 m' }] },
    { title: 'Part 3 — Core & Cooldown', items: [
      { n: 'Adductor side plank', d: '2 × 20–30 sec/side' },
      { n: 'Standing calf iso', d: '2 × 30–45 sec' },
      { n: 'Chin-tuck iso', d: '2 × 20 sec' },
      { n: 'Hanging leg raise', d: '3 × 8–12' },
      { n: 'Pallof press', d: '2 × 10/side' },
      { n: 'T-spine mobility', d: '3 min' }] }] },

  { code: 'D', name: 'Vertical Power + Full Body', focus: 'Jump quality and strength reserve', warmup: GYM_WARMUP, parts: [
    { title: 'Part 1 — Gym', items: [
      { n: 'Hack squat or leg press', d: '4 × 6 · RPE 7–8; no free-bar full-ROM squat' },
      { n: 'Neutral-grip pulldown', d: '4 × 8 · RPE 7–8' },
      { n: 'DB incline press', d: '3 × 8 · controlled' },
      { n: 'Reverse lunge', d: '3 × 8/leg · stable knee/ankle' },
      { n: 'Cable face pull', d: '3 × 12–15 · scapular control' },
      { n: 'Back extension', d: '3 × 10 · glutes + hamstrings' }] },
    { title: 'Part 2 — Athletic', items: [
      { n: 'Countermovement jump', d: '4 × 3', p: true },
      { n: 'Snap-down', d: '2 × 4', p: true },
      { n: 'Clean pull or jump shrug', d: '4 × 2 · RPE 6–7', p: true },
      { n: 'Suitcase carry', d: '3 × 30 m/side' }] },
    { title: 'Part 3 — Core & Cooldown', items: [
      { n: 'Nordic eccentric', d: '3 × 3–5 · 4–5 sec lower' },
      { n: 'Soleus iso', d: '2 × 30–45 sec' },
      { n: 'Neck flexion/lateral iso', d: '2 × 15–20 sec each · pain-free' },
      { n: 'Ab wheel', d: '3 × 6–10' },
      { n: 'Dead bug', d: '2 × 8/side' },
      { n: 'Ankle + hip mobility', d: '3 min' }] }] },

  { code: 'E', name: 'Capacity + Weak Links (Optional)', focus: 'Work capacity, arms, grip, trunk and technique', warmup: GYM_WARMUP, parts: [
    { title: 'Part 1 — Gym', items: [
      { n: 'Goblet squat to box', d: '3 × 8 · RPE 6–7' },
      { n: 'Neutral-grip pulldown', d: '3 × 10 · RPE 7' },
      { n: 'Close-grip DB press', d: '3 × 10 · 2 reps in reserve' },
      { n: 'Cable row', d: '3 × 10 · smooth' },
      { n: 'Hamstring curl', d: '3 × 10–12 · controlled' },
      { n: 'Lateral raise', d: '2 × 12–15 · no swing' },
      { n: 'DB curl', d: '2 × 10–12 · optional' },
      { n: 'Rope pressdown', d: '2 × 10–12 · optional' }] },
    { title: 'Part 2 — Athletic', items: [
      { n: 'Med-ball slam', d: '4 × 4', p: true },
      { n: 'Low pogo', d: '2 × 20', p: true },
      { n: 'Jump shrug', d: '3 × 3 · RPE 6', p: true },
      { n: 'Farmer carry', d: '2 × 40 m' }] },
    { title: 'Part 3 — Core & Cooldown', items: [
      { n: 'Calf iso', d: '2 × 45 sec' },
      { n: 'Adductor squeeze', d: '2 × 30 sec' },
      { n: 'Neck iso circuit', d: '2 rounds · pain-free' },
      { n: 'Plank', d: '3 × 45–60 sec' },
      { n: 'Pallof press', d: '2 × 10/side' },
      { n: 'Mobility', d: '3–5 min' }] }] },

  { code: 'F', name: 'Unilateral Strength + Landmine Power', focus: 'Single-leg strength, rotational power and anti-rotation', warmup: GYM_WARMUP, parts: [
    { title: 'Part 1 — Gym', items: [
      { n: 'DB Bulgarian split squat', d: '4 × 6/leg · RPE 7–8; 3 sec lower' },
      { n: 'Single-arm DB row', d: '4 × 8/side · pause at top' },
      { n: 'Half-kneeling landmine press', d: '3 × 8/side · ribs down' },
      { n: 'Cable pull-through', d: '3 × 12 · hinge, squeeze glutes' },
      { n: 'Lat pulldown', d: '3 × 10 · full stretch at top' },
      { n: 'Leg extension', d: '2 × 12–15 · 2 sec squeeze, knee-friendly range' }] },
    { title: 'Part 2 — Athletic', items: [
      { n: 'Landmine rotational press', d: '3 × 4/side · explosive hip turn', p: true },
      { n: 'Skater bound to stick', d: '3 × 4/side · hold landing 2 sec', p: true },
      { n: 'Single-leg low box jump', d: '3 × 3/side · step down', p: true },
      { n: 'Single-arm overhead carry', d: '2 × 20 m/side · stacked ribs' }] },
    { title: 'Part 3 — Core & Cooldown', items: [
      { n: 'Short-lever Copenhagen plank', d: '2 × 20 sec/side' },
      { n: 'Half-kneeling cable chop', d: '2 × 10/side' },
      { n: 'Neck flexion iso', d: '2 × 15–20 sec, pain-free' },
      { n: '90/90 hip switches', d: '2 min' },
      { n: 'Box breathing', d: '2 min · 4-4-4-4' }] }] },

  { code: 'G', name: 'Sprint Mechanics + Machine Strength', focus: 'Acceleration posture, hamstrings and horizontal pressing', warmup: GYM_WARMUP + ' Add 2 × 20 m build-ups before sprinting.', parts: [
    { title: 'Part 1 — Gym', items: [
      { n: 'Smith machine incline press', d: '4 × 6 · RPE 7–8' },
      { n: 'Smith machine split squat', d: '3 × 8/leg · controlled' },
      { n: 'Seated leg curl', d: '3 × 10 · 3 sec lower' },
      { n: 'Wide-grip seated cable row', d: '3 × 10 · elbows out, squeeze' },
      { n: '45° back extension', d: '3 × 10 · 1 sec hold at top' },
      { n: 'Machine chest fly', d: '2 × 12–15 · stretch + squeeze' }] },
    { title: 'Part 2 — Athletic', items: [
      { n: 'Wall drill march', d: '3 × 10/side · 45° lean' },
      { n: 'A-skip', d: '3 × 15 m' },
      { n: 'Falling start sprint', d: '4 × 10 m · full rest', p: true },
      { n: 'Build-up sprint', d: '4 × 20 m · 85–90%', p: true },
      { n: 'Med-ball scoop toss', d: '3 × 4', p: true },
      { n: 'Waiter carry', d: '2 × 20 m/side' }] },
    { title: 'Part 3 — Core & Cooldown', items: [
      { n: 'Tall-kneeling Pallof hold', d: '2 × 20 sec/side' },
      { n: 'Neck lateral iso', d: '2 × 15–20 sec/side, pain-free' },
      { n: 'Tibialis raise', d: '2 × 15' },
      { n: 'Hamstring floss', d: '2 min' },
      { n: 'Nasal breathing walk', d: '3 min' }] }] },

  { code: 'H', name: 'Lateral Power + Vertical Pull', focus: 'Frontal-plane strength, lateral explosiveness and pulling strength', warmup: GYM_WARMUP, parts: [
    { title: 'Part 1 — Gym', items: [
      { n: 'Goblet lateral lunge', d: '3 × 6/side · sit into the hip' },
      { n: 'Weighted or assisted pull-up', d: '4 × 4–6 · strict' },
      { n: 'DB push press', d: '3 × 5 · fast dip-drive' },
      { n: 'Single-leg hip thrust', d: '3 × 10/side · 1 sec lockout' },
      { n: 'Hip adductor machine', d: '2 × 12–15 · controlled' },
      { n: 'Hip abductor machine', d: '2 × 15' }] },
    { title: 'Part 2 — Athletic', items: [
      { n: 'Heiden skater jump', d: '3 × 6 continuous', p: true },
      { n: 'Lateral shuffle to sprint', d: '4 × (5 m shuffle + 10 m sprint)', p: true },
      { n: 'Crossover step start', d: '3 × 2/side', p: true },
      { n: 'Med-ball rotational side toss', d: '3 × 5/side', p: true },
      { n: 'Suitcase march', d: '2 × 20 m/side' }] },
    { title: 'Part 3 — Core & Cooldown', items: [
      { n: 'Side plank with top-leg raise', d: '2 × 20 sec/side' },
      { n: 'Chin-tuck iso', d: '2 × 20 sec' },
      { n: 'Standing calf iso', d: '2 × 30–45 sec' },
      { n: 'Adductor rock-backs', d: '2 min' },
      { n: 'Down-regulation breathing', d: '2 min · long exhales' }] }] },

  { code: 'I', name: 'Explosive Hinge + Posterior Chain', focus: 'Hip-extension power, hamstrings and upper-back strength', warmup: GYM_WARMUP, parts: [
    { title: 'Part 1 — Gym', items: [
      { n: 'Rack pull (knee height)', d: '4 × 4 · RPE 7; fast lockout' },
      { n: 'Single-leg leg press', d: '3 × 10/leg' },
      { n: 'Machine chest press', d: '3 × 8 · RPE 7–8' },
      { n: 'Landmine T-bar row', d: '4 × 8 · chest up' },
      { n: 'Glute-ham raise', d: '3 × 5 · slow lower (band-assisted Nordic if no GHR)' },
      { n: 'Machine shoulder press', d: '3 × 10 · no grinding' }] },
    { title: 'Part 2 — Athletic', items: [
      { n: 'Kettlebell swing', d: '4 × 10 · snap the hips', p: true },
      { n: 'Box jump', d: '4 × 3 · step down', p: true },
      { n: 'Hurdle hop', d: '3 × 4 · quick contacts', p: true },
      { n: 'Heavy farmer carry', d: '3 × 20 m' }] },
    { title: 'Part 3 — Core & Cooldown', items: [
      { n: 'Bent-knee hanging windshield wiper', d: '2 × 6/side' },
      { n: 'Soleus iso', d: '2 × 30–45 sec' },
      { n: 'Neck flexion iso', d: '2 × 15–20 sec, pain-free' },
      { n: 'Couch stretch', d: '1 min/side' },
      { n: 'Pigeon stretch', d: '1 min/side' }] }] },

  { code: 'J', name: 'Athletic Circuit + Work Capacity', focus: 'Conditioning reserve, trunk stiffness and weak-link volume', warmup: GYM_WARMUP, parts: [
    { title: 'Part 1 — Gym', items: [
      { n: 'Belt squat', d: '3 × 10 · RPE 7 (DB box squat if no belt squat)' },
      { n: 'Single-leg cable RDL', d: '3 × 10/side' },
      { n: 'DB floor press', d: '3 × 8–10' },
      { n: 'Half-kneeling single-arm pulldown', d: '3 × 10/side' },
      { n: 'Reverse pec deck', d: '2 × 15 · rear delts' },
      { n: 'Seated calf raise', d: '2 × 15 · pause at bottom' }] },
    { title: 'Part 2 — Athletic', items: [
      { n: 'Med-ball overhead throw', d: '3 × 4', p: true },
      { n: '5-10-5 pro agility', d: '4 reps · full recovery', p: true },
      { n: 'Sled push', d: '5 × 15 m · strong lean' },
      { n: 'Bear-hug carry', d: '3 × 25 m · sandbag or heavy DB' }] },
    { title: 'Part 3 — Core & Cooldown', items: [
      { n: 'Stir the pot', d: '2 × 8/direction' },
      { n: 'Bird dog', d: '2 × 8/side · 2 sec hold' },
      { n: 'Neck iso circuit', d: '2 rounds · pain-free' },
      { n: 'Full-body mobility flow', d: '5 min' },
      { n: '4-7-8 breathing', d: '2 min' }] }] },
];

export const EMERGENCY = [
  { code: 'H1', name: 'Emergency Home 1', summary: '3 rounds: 10 push-ups · 12 split squats/leg · 12 backpack rows · 15 glute bridges · 30–45s plank. Finish with 3×3 controlled squat jumps.', items: [
    { n: 'Push-up', d: '10 reps' }, { n: 'Split squat', d: '12/leg' }, { n: 'Backpack row', d: '12 reps' }, { n: 'Glute bridge', d: '15 reps' }, { n: 'Plank', d: '30–45 sec' }, { n: 'Controlled squat jump', d: '3 × 3 finisher' }] },
  { code: 'H2', name: 'Emergency Home 2', summary: '4 rounds: 8 pike push-ups · 10 reverse lunges/leg · 12 backpack RDLs · 10 backpack rows · 20 mountain climbers. Finish with 4×5 pogo contacts.', items: [
    { n: 'Pike push-up', d: '8 reps' }, { n: 'Reverse lunge', d: '10/leg' }, { n: 'Backpack RDL', d: '12 reps' }, { n: 'Backpack row', d: '10 reps' }, { n: 'Mountain climber', d: '20 reps' }, { n: 'Pogo', d: '4 × 5 contacts finisher' }] },
  { code: 'H3', name: 'Emergency Home 3', summary: '3 rounds: 12 tempo split squats/leg · 10 push-ups · 12 backpack rows · 10 single-leg RDL/leg · 30s side plank/side. Finish with 5 min mobility.', items: [
    { n: 'Tempo split squat', d: '12/leg' }, { n: 'Push-up', d: '10 reps' }, { n: 'Backpack row', d: '12 reps' }, { n: 'Single-leg RDL', d: '10/leg' }, { n: 'Side plank', d: '30 sec/side' }, { n: 'Mobility flow', d: '5 min finisher' }] },
  { code: 'H4', name: 'Emergency Home 4', summary: '4 rounds: 5 squat jumps (stick each landing) · 12 backpack goblet squats · 12 decline push-ups · 10 backpack bent-over rows · 20s hollow hold. Finish with 3×20s fast feet.', items: [
    { n: 'Squat jump', d: '5 reps · stick each landing' }, { n: 'Backpack goblet squat', d: '12 reps' }, { n: 'Decline push-up', d: '12 reps' }, { n: 'Backpack bent-over row', d: '10 reps' }, { n: 'Hollow hold', d: '20 sec' }, { n: 'Fast feet drill', d: '3 × 20 sec finisher' }] },
  { code: 'H5', name: 'Emergency Home 5', summary: '3 rounds: 10 chair Bulgarian split squats/leg · 12 single-leg glute bridges/leg · 10 backpack floor press · 12 single-arm backpack rows/side · 10 dead bugs/side. Finish with 3×30s wall sit + 2 min breathing.', items: [
    { n: 'Bulgarian split squat', d: '10/leg · rear foot on chair' }, { n: 'Single-leg glute bridge', d: '12/leg' }, { n: 'Backpack floor press', d: '10 reps' }, { n: 'Single-arm backpack row', d: '12/side' }, { n: 'Dead bug', d: '10/side' }, { n: 'Wall sit', d: '3 × 30 sec finisher' }, { n: 'Box breathing', d: '2 min' }] },
];

// Plyometrics: original prescriptions kept; purpose, rest, cues and notes added.
export const PLYO = [
  { code: 'P1', name: 'Landing Base', time: '6–8 min', level: 'Low', focus: 'Landing mechanics + ankle stiffness',
    purpose: 'Build the landing positions every other jump depends on — quiet, balanced, knees tracking over toes.',
    items: [
      { n: 'Snap-down', d: '3 × 4', r: '45 sec', c: 'Whip arms down, land hips-back in an athletic stance.' },
      { n: 'Pogo jump', d: '2 × 20 · 40 contacts', r: '60 sec', c: 'Stiff ankles, bounce off the balls of the feet.' },
      { n: 'Stick landing', d: '3 × 3', r: '45 sec', c: 'Freeze 2 sec; no knee cave, chest over knees.' }],
    progression: 'Add a small hop before the stick, then single-leg sticks.', regression: 'Drop to 2 sets and land from a smaller hop.', safety: 'Stop if shins or knees ache. Softer surface preferred.' },
  { code: 'P2', name: 'Vertical Pop', time: '8–10 min', level: 'High', focus: 'Vertical force',
    purpose: 'Express maximal vertical force while fresh — quality over quantity.',
    items: [
      { n: 'Countermovement jump', d: '4 × 3', r: '60–90 sec', c: 'Fast dip, full arm swing, land softly and reset each rep.' },
      { n: 'Pogo jump', d: '2 × 15', r: '60 sec', c: 'Minimal knee bend, quick ground contact.' },
      { n: 'Squat jump', d: '2 × 3', r: '90 sec', c: 'Pause 2 sec at the bottom, then explode — no dip.' }],
    progression: 'Add a reach target or a 3rd set of CMJ.', regression: 'Remove the squat jumps; keep CMJ 3 × 3.', safety: 'Skip on days after heavy lower-body gym or if knees are sore.' },
  { code: 'P3', name: 'Horizontal Power', time: '8–10 min', level: 'Medium', focus: 'Horizontal projection',
    purpose: 'Train horizontal force for the first step and transition speed.',
    items: [
      { n: 'Broad jump', d: '4 × 2', r: '60–90 sec', c: 'Big arm swing, land with hips back and stick it.' },
      { n: 'Ankling drill', d: '3 × 15 m', r: 'Walk back', c: 'Short, quick contacts under the hips.' },
      { n: 'Bounding', d: '2 × 10 m', r: '90 sec', c: 'Drive the knee, push the ground behind you.' }],
    progression: 'Link 2 broad jumps continuously.', regression: 'Replace bounds with skips for distance.', safety: 'Needs a non-slip surface.' },
  { code: 'P4', name: 'Lateral Reactivity', time: '8–10 min', level: 'Medium', focus: 'COD + frontal-plane control',
    purpose: 'Build side-to-side elasticity and control for defensive slides and cuts.',
    items: [
      { n: 'Lateral line hops', d: '3 × 10/side', r: '45 sec', c: 'Quick and light, stay tall.' },
      { n: 'Lateral bound', d: '3 × 3/side', r: '60 sec', c: 'Push off the outside leg, land on the other and stick.' },
      { n: 'Lateral stick landing', d: '2 × 3/side', r: '45 sec', c: 'Knee over mid-foot, hip loaded.' }],
    progression: 'Make the lateral bounds continuous (3 in a row).', regression: 'Shorter bounds and 2 sets.', safety: 'Stop on any ankle or groin pain.' },
  { code: 'P5', name: 'Single-Leg', time: '8–10 min', level: 'Medium', focus: 'Unilateral elastic strength',
    purpose: 'Single-leg stiffness and landing control — basketball happens on one leg.',
    items: [
      { n: 'Single-leg pogo', d: '2 × 10/side', r: '45 sec', c: 'Small, quick contacts; hips level.' },
      { n: 'Single-leg bound', d: '3 × 3/side', r: '60 sec', c: 'Drive the free knee; land balanced.' },
      { n: 'Step-off stick landing', d: '2 × 3/side', r: '45 sec', c: 'Step off a low box, stick on one leg for 2 sec.' }],
    progression: 'Add a lateral single-leg hop.', regression: 'Double-leg pogo instead of single-leg.', safety: 'Keep the step-off box low (20–30 cm).' },
  { code: 'P6', name: 'Approach Jump', time: '8–10 min', level: 'High', focus: 'Game-speed jumping',
    purpose: 'Convert run-up speed into vertical — the jump you actually use in games.',
    items: [
      { n: 'Approach jump', d: '4 × 3', r: '60–90 sec', c: '2–3 step approach, penultimate step long and low.' },
      { n: 'Pogo jump', d: '2 × 15', r: '60 sec', c: 'Stiff ankles.' },
      { n: 'Snap-down', d: '2 × 4', r: '45 sec', c: 'Land quiet and balanced.' }],
    progression: 'Add a rim/reach target, then a 1-foot approach.', regression: '2-step approach only.', safety: 'Full rest; stop when jump height drops.' },
  { code: 'P7', name: 'Reactive Start', time: '8–10 min', level: 'High', focus: 'Reaction + first step',
    purpose: 'Make the first step explosive and reactive.',
    items: [
      { n: 'Split-stance jump', d: '3 × 3/side', r: '60 sec', c: 'Explode straight up, land in the same stance.' },
      { n: 'Low hurdle hops', d: '3 × 5', r: '60 sec', c: 'Rebound quickly off the ground.' },
      { n: '2-step burst', d: '4 × 5 m', r: '45 sec', c: 'React to a cue or clap, low shin angles.' }],
    progression: 'Use a partner or visual cue for the bursts.', regression: 'Line hops instead of hurdles.', safety: 'Hurdles must be low and collapsible.' },
  { code: 'P8', name: 'Ankle / Shin Friendly', time: '6–8 min', level: 'Low', focus: 'Lower-leg capacity',
    purpose: 'Build tendon and lower-leg tolerance with low impact.',
    items: [
      { n: 'Ankling drill', d: '3 × 15 m', r: 'Walk back', c: 'Relaxed, quick, springy.' },
      { n: 'Calf isometric hold', d: '2 × 45 sec', r: '30 sec', c: 'Heels slightly raised, press hard into the floor.' },
      { n: 'Low pogo', d: '2 × 15', r: '45 sec', c: 'Tiny height, fast contacts.' },
      { n: 'Ankle rocks', d: '2 × 10', r: '—', c: 'Knee over toes, heel down.' }],
    progression: 'Lengthen the isos to 60 sec.', regression: 'Remove the pogos.', safety: 'Ideal when shins feel beaten up.' },
  { code: 'P9', name: 'Deceleration', time: '7–9 min', level: 'Low–Medium', focus: 'Braking + landing',
    purpose: 'Teach the body to absorb force — protects knees during hard stops.',
    items: [
      { n: 'Snap-down', d: '3 × 4', r: '45 sec', c: 'Fast drop into a quiet landing.' },
      { n: 'Lateral stick landing', d: '3 × 3/side', r: '45 sec', c: 'Absorb through the hip, not the knee.' },
      { n: 'Drop to stick', d: '2 × 3', r: '60 sec', c: 'Step off a low box, freeze on landing.' }],
    progression: 'Sprint 5 m into a stop.', regression: 'Lower box and fewer reps.', safety: 'Keep landings silent.' },
  { code: 'P10', name: 'Elastic Rhythm', time: '6–8 min', level: 'Low', focus: 'Elastic rhythm',
    purpose: 'Develop rhythm and elastic bounce on low-intensity days.',
    items: [
      { n: 'Pogo jump', d: '3 × 15', r: '45 sec', c: 'Consistent rhythm.' },
      { n: 'Line hops (front-back and side-side)', d: '2 × 15 each', r: '45 sec', c: 'Light and quick.' },
      { n: 'A-skip', d: '3 × 15 m', r: 'Walk back', c: 'Tall posture, active foot strike.' }],
    progression: 'Add B-skips.', regression: 'Reduce to 2 sets.', safety: 'Low intensity — no grinding.' },
  { code: 'P11', name: 'Max Jump', time: '8–10 min', level: 'High', focus: 'Peak jump quality',
    purpose: 'Peak-intent jumping with low volume.',
    items: [
      { n: 'Countermovement jump', d: '3 × 3', r: '90 sec', c: 'Every rep at max intent.' },
      { n: 'Approach jump', d: '3 × 2', r: '90 sec', c: 'Full speed approach.' },
      { n: 'Lateral bound', d: '2 × 3/side', r: '60 sec', c: 'Stick each landing.' }],
    progression: 'Track height with a reach target.', regression: '2 sets each.', safety: 'Only when fresh — not the day after legs.' },
  { code: 'P12', name: 'Broad + Bound', time: '8–10 min', level: 'Medium', focus: 'Horizontal + unilateral power',
    purpose: 'Combine horizontal and single-leg power.',
    items: [
      { n: 'Broad jump', d: '3 × 2', r: '60–90 sec', c: 'Stick each landing.' },
      { n: 'Single-leg bound', d: '3 × 3/side', r: '60 sec', c: 'Rhythm and push.' },
      { n: 'Ankling drill', d: '2 × 15 m', r: 'Walk back', c: 'Quick feet.' }],
    progression: 'Continuous bounds for distance.', regression: 'Double-leg only.', safety: 'Non-slip surface.' },
  { code: 'P13', name: 'Recovery Elastic', time: '5–7 min', level: 'Recovery', focus: 'Movement quality',
    purpose: 'Keep tissues moving on recovery days without adding fatigue.',
    items: [
      { n: 'Calf isometric hold', d: '2 × 45 sec', r: '30 sec', c: 'Steady pressure.' },
      { n: 'Landing mechanics drill', d: '2 × 3', r: '30 sec', c: 'Slow and perfect.' },
      { n: 'Ankle mobility', d: '4 min', r: '—', c: 'Pain-free range.' }],
    progression: '—', regression: 'Mobility only.', safety: 'Should feel restorative.' },
  { code: 'P14', name: 'Court Primer', time: '6–8 min', level: 'Medium', focus: 'Basketball readiness',
    purpose: 'Prime the body right before basketball.',
    items: [
      { n: 'Pogo jump', d: '2 × 15', r: '30 sec', c: 'Wake up the ankles.' },
      { n: 'Countermovement jump', d: '2 × 3', r: '45 sec', c: 'Crisp, not maximal.' },
      { n: 'Lateral hop', d: '2 × 8/side', r: '30 sec', c: 'Quick.' },
      { n: 'Acceleration start', d: '3 × 5 m', r: '30 sec', c: 'Explosive first step.' }],
    progression: 'Add a reaction cue to the starts.', regression: 'Drop the CMJ.', safety: 'Leave energy for the court.' },
  { code: 'P15', name: 'Drop & Rebound', time: '7–9 min', level: 'Medium–High', focus: 'Reactive strength (short ground contact)',
    purpose: 'Improve reactive strength — how quickly you turn a landing into a jump (second jumps, putbacks).',
    items: [
      { n: 'Depth drop to stick', d: '3 × 3 · 30–40 cm box', r: '60 sec', c: 'Step off (don’t jump off), land silent and freeze.' },
      { n: 'Drop jump', d: '3 × 3 · 30 cm box', r: '90 sec', c: 'Touch and go — minimal ground time, jump straight up.' },
      { n: 'Rebound pogo', d: '2 × 10', r: '60 sec', c: 'Stiff, fast, tall.' }],
    progression: 'Add a reach target to the drop jumps.', regression: 'Depth drops only (no rebound).', safety: 'Only after P1/P9 landings are clean. Box ≤ 40 cm. Never the morning after heavy legs.' },
];

// Morning core: C1–C7 original, C8–C15 added.
export const CORE = [
  { code: 'C1', name: 'Anti-extension', purpose: 'Resist lower-back arching — the base for sprinting and landing.', rest: '30–45 sec between sets',
    items: [{ n: 'Plank', d: '3 × 30–45 sec', c: 'Squeeze glutes, ribs down.' }, { n: 'Dead bug', d: '2 × 8/side', c: 'Lower back stays glued to the floor.' }, { n: 'Hollow hold', d: '2 × 20 sec', c: 'Shorten the lever if the back lifts.' }],
    progression: 'RKC plank (max tension) for 20 sec.', regression: 'Knee plank and bent-knee hollow.' },
  { code: 'C2', name: 'Rotation', purpose: 'Rotational control for passing, shooting and changing direction.', rest: '30 sec',
    items: [{ n: 'Russian twist', d: '3 × 12/side', c: 'Rotate through the ribs, not just the arms.' }, { n: 'Bicycle crunch', d: '3 × 20', c: 'Slow and controlled.' }, { n: 'Side plank', d: '2 × 30 sec/side', c: 'Straight line from head to heels.' }],
    progression: 'Hold a light plate for the twists.', regression: 'Feet down for the twists.' },
  { code: 'C3', name: 'Hip flexion', purpose: 'Strong hip flexors and lower abs for knee drive.', rest: '45 sec',
    items: [{ n: 'Hanging knee raise', d: '3 × 8–12', c: 'No swinging; tilt the pelvis up.' }, { n: 'Reverse crunch', d: '3 × 10', c: 'Curl the hips off the floor.' }, { n: 'Dead bug', d: '2 × 8/side', c: 'Exhale fully.' }],
    progression: 'Straight-leg raises.', regression: 'Lying knee tucks.' },
  { code: 'C4', name: 'Athletic trunk', purpose: 'Anti-rotation and shoulder stability together.', rest: '30 sec',
    items: [{ n: 'Pallof press', d: '3 × 10/side', c: 'Hips square, press straight out.' }, { n: 'Plank shoulder tap', d: '2 × 10/side', c: 'Hips don’t sway.' }, { n: 'Bear hold', d: '3 × 20 sec', c: 'Knees 2 cm off the floor.' }],
    progression: 'Bear crawl instead of the hold.', regression: 'Wider feet for the shoulder taps.' },
  { code: 'C5', name: 'Mixed core', purpose: 'A bit of everything on a normal day.', rest: '30 sec',
    items: [{ n: 'Plank', d: '2 × 45 sec', c: 'Ribs down.' }, { n: 'Bicycle crunch', d: '3 × 20', c: 'Controlled.' }, { n: 'Russian twist', d: '2 × 12/side', c: 'Rotate the trunk.' }, { n: 'Lying leg raise', d: '2 × 8', c: 'Lower back down.' }],
    progression: 'Add a 3rd round.', regression: 'Bent-knee leg raises.' },
  { code: 'C6', name: 'Low-impact', purpose: 'Gentle trunk work on tired or sore days.', rest: '20–30 sec',
    items: [{ n: 'Dead bug', d: '3 × 8/side', c: 'Slow.' }, { n: 'Side plank', d: '2 × 30 sec', c: 'Knees down if needed.' }, { n: 'Glute bridge', d: '2 × 12', c: '1 sec squeeze.' }, { n: 'Diaphragmatic breathing', d: '2 min', c: 'Belly and ribs expand.' }],
    progression: '—', regression: 'Breathing only.' },
  { code: 'C7', name: 'Hard core', purpose: 'Max-strength trunk day — only when fresh.', rest: '60 sec',
    items: [{ n: 'Hanging leg raise', d: '3 × 8', c: 'Strict.' }, { n: 'Ab wheel rollout', d: '3 × 6–8 if controlled', c: 'Stop before the back sags.' }, { n: 'Russian twist', d: '2 × 15/side', c: 'Control.' }],
    progression: 'Toes-to-bar.', regression: 'Knee raises and kneeling rollouts to a wall.' },
  { code: 'C8', name: 'Lateral stability', purpose: 'Resist side-bending — protects the spine when contact happens.', rest: '30 sec',
    items: [{ n: 'Side plank', d: '3 × 30 sec/side', c: 'Hips high.' }, { n: 'Suitcase hold', d: '3 × 30 sec/side', c: 'Heavy DB or backpack, stay perfectly tall.' }, { n: 'Short-lever Copenhagen plank', d: '2 × 15–20 sec/side', c: 'Knee on the bench.' }],
    progression: 'Side plank with top-leg raise.', regression: 'Side plank from the knees.' },
  { code: 'C9', name: 'Rollout strength', purpose: 'Long-lever anti-extension for strength.', rest: '45 sec',
    items: [{ n: 'Stability ball rollout', d: '3 × 8', c: 'Hips extended, ribs down.' }, { n: 'Stir the pot', d: '2 × 6/direction', c: 'Small circles, no hip sway.' }, { n: 'Body saw', d: '2 × 8', c: 'Forearms on the floor, slide forward and back.' }],
    progression: 'Ab wheel from the knees.', regression: 'Shorter range.' },
  { code: 'C10', name: 'Anti-rotation', purpose: 'Resist twisting under load — trunk stiffness for contact.', rest: '30 sec',
    items: [{ n: 'Bird dog', d: '3 × 8/side · 2 sec hold', c: 'Don’t let the hips rotate.' }, { n: 'Plank drag-through', d: '3 × 8/side', c: 'Drag a backpack under the body.' }, { n: 'Renegade row hold', d: '2 × 20 sec/side', c: 'Wide feet, square hips.' }],
    progression: 'Renegade rows with DBs.', regression: 'Bird dog only.' },
  { code: 'C11', name: 'Glute + trunk', purpose: 'Connect hips and trunk for jumping and sprinting.', rest: '30 sec',
    items: [{ n: 'Glute bridge march', d: '3 × 10/side', c: 'Hips stay level.' }, { n: 'Single-leg hip thrust', d: '2 × 10/side', c: 'Shoulders on a bench or sofa.' }, { n: 'Reverse plank', d: '2 × 30 sec', c: 'Squeeze the glutes.' }],
    progression: 'Add a load on the hips.', regression: 'Double-leg bridge.' },
  { code: 'C12', name: 'Mobility core', purpose: 'Wake the spine and hips gently after sleep.', rest: 'Flow continuously',
    items: [{ n: 'Cat-cow', d: '1 min', c: 'Segment by segment.' }, { n: 'World’s greatest stretch', d: '3/side', c: 'Rotate and reach.' }, { n: 'Hollow rock', d: '3 × 12', c: 'Small rock, tight body.' }, { n: 'T-spine rotation', d: '2 × 8/side', c: 'Follow your hand with your eyes.' }],
    progression: 'Add a plank to downward-dog flow.', regression: 'Hollow hold instead of rocks.' },
  { code: 'C13', name: 'Breathing + deep core', purpose: 'Deep core and diaphragm control; resets posture.', rest: '20 sec',
    items: [{ n: '90/90 breathing', d: '2 min', c: 'Feet on a wall, full exhale.' }, { n: 'Dead bug with exhale', d: '3 × 6/side', c: 'Exhale as the limbs extend.' }, { n: 'Bear crawl', d: '3 × 10 m', c: 'Slow, quiet.' }, { n: 'Side plank', d: '2 × 20 sec/side', c: 'Breathe normally.' }],
    progression: 'Band-resisted dead bug.', regression: 'Breathing + dead bug only.' },
  { code: 'C14', name: 'Rotational power', purpose: 'Transfer force through the trunk quickly.', rest: '45 sec',
    items: [{ n: 'Band woodchop', d: '3 × 10/side', c: 'Rotate from the hips.' }, { n: 'Med-ball rotational slam', d: '3 × 5/side', c: 'Light ball, fast.' }, { n: 'Half-kneeling band lift', d: '2 × 8/side', c: 'Tall posture.' }],
    progression: 'Heavier band or ball.', regression: 'Slow tempo chops.' },
  { code: 'C15', name: 'Endurance circuit', purpose: 'Core endurance for late-game posture.', rest: '60 sec between rounds',
    items: [{ n: 'Plank', d: '3 rounds × 40 sec', c: 'Ribs down.' }, { n: 'Mountain climber', d: '3 rounds × 20', c: 'Hips level.' }, { n: 'V-up', d: '3 rounds × 10', c: 'Controlled.' }, { n: 'Side plank', d: '3 rounds × 20 sec/side', c: 'Straight line.' }],
    progression: '4 rounds.', regression: '2 rounds, tuck-ups instead of V-ups.' },
];

// Basketball: BB1–BB10 keep the original block minutes; BB11–BB14 added.
export const BASKETBALL = [
  { code: 'BB1', name: 'Handle + Reaction', time: '60–75 min', summary: 'Warm-up 8 min; stationary + moving handles 15; tennis-ball reaction 8; change-of-speed attacks 12; finishing 12; free throws 5', blocks: [
    { t: 'Warm-up · 8 min', items: [{ n: 'Dynamic basketball warm-up', d: 'Jog, skips, lunges, hip openers' }, { n: 'Form shooting', d: '10 makes close to the rim' }] },
    { t: 'Skill Block 1 · Handles · 15 min', items: [{ n: 'Pound dribble', d: '3 × 30 sec each hand' }, { n: 'Crossover dribble', d: '3 × 30 sec' }, { n: 'Between the legs dribble', d: '3 × 30 sec' }, { n: 'Figure 8 dribble', d: '2 × 30 sec' }, { n: 'Two-ball dribble', d: '3 × 30 sec' }, { n: 'Zig-zag dribble', d: '2 full-court trips' }] },
    { t: 'Skill Block 2 · Reaction · 8 min', items: [{ n: 'Tennis ball dribble drill', d: '4 × 30 sec — toss and catch while dribbling' }, { n: 'Reaction ball drop', d: '3 × 5 — catch then attack' }] },
    { t: 'Game-Speed · Change of speed · 12 min', items: [{ n: 'Hesitation dribble move', d: '3 × 5/side — hesi to burst' }, { n: 'In and out dribble', d: '3 × 5/side' }, { n: 'Retreat dribble', d: '3 × 4 — retreat then attack' }] },
    { t: 'Finisher · Finishing · 12 min', items: [{ n: 'Mikan drill', d: '2 × 1 min' }, { n: 'Reverse layup', d: '10/side' }, { n: 'Euro step layup', d: '10 makes' }] },
    { t: 'Cooldown · 5 min', items: [{ n: 'Free throws', d: '5 min' }, { n: 'Calf + hip stretch', d: '3 min' }] }] },
  { code: 'BB2', name: 'Speed + Sprints', time: '60–75 min', summary: 'Warm-up 10; 6×10 m acceleration; 4×20 m sprints; defensive slides 4×10 m; cone COD 15; change-of-pace attacks 15; finishing 10', blocks: [
    { t: 'Warm-up · 10 min', items: [{ n: 'Dynamic basketball warm-up', d: 'Jog, skips, leg swings' }, { n: 'A-skip', d: '2 × 15 m' }] },
    { t: 'Skill Block 1 · Acceleration', items: [{ n: 'Acceleration sprint', d: '6 × 10 m' }, { n: '20 m sprint', d: '4 × 20 m · full rest' }] },
    { t: 'Skill Block 2 · Defense + COD · 15 min', items: [{ n: 'Defensive slides', d: '4 × 10 m' }, { n: '5-10-5 shuttle', d: '4 reps' }, { n: 'T-drill agility', d: '3 reps' }, { n: 'Cone weave dribble', d: '4 trips' }] },
    { t: 'Game-Speed · Change of pace · 15 min', items: [{ n: 'Change of pace dribble', d: '4 × 5/side' }, { n: 'Full-court speed dribble layup', d: '6 reps' }] },
    { t: 'Finisher · Finishing · 10 min', items: [{ n: 'Speed layups', d: '10/hand' }, { n: 'Power layup', d: '10 makes' }] },
    { t: 'Cooldown', items: [{ n: 'Walk + calf/hip stretch', d: '5 min' }] }] },
  { code: 'BB3', name: 'Shooting + Relocation', time: '60–80 min', summary: 'Warm-up 8; form shooting 10; 5-spot shooting 20; relocation 15; off-dribble pull-ups 15; free throws 5', blocks: [
    { t: 'Warm-up · 8 min', items: [{ n: 'Dynamic basketball warm-up', d: 'Jog, skips, arm circles' }] },
    { t: 'Skill Block 1 · Form shooting · 10 min', items: [{ n: 'One-hand form shooting', d: '3 spots × 10' }, { n: 'BEEF shooting drill', d: '20 makes close range' }] },
    { t: 'Skill Block 2 · 5-spot shooting · 20 min', items: [{ n: '5 spot shooting drill', d: '10 shots per spot — track makes' }, { n: 'Catch and shoot', d: '5 spots × 5' }] },
    { t: 'Game-Speed · Relocation · 15 min', items: [{ n: 'Shot relocation drill', d: 'Shoot → relocate → shoot, 5 × 1 min' }, { n: 'Lift and drift shooting', d: '10 makes' }] },
    { t: 'Finisher · Off-dribble pull-ups · 15 min', items: [{ n: 'One dribble pull-up jumper', d: '10/side' }, { n: 'Two dribble pull-up jumper', d: '10/side' }] },
    { t: 'Cooldown · 5 min', items: [{ n: 'Free throws', d: '5 min' }] }] },
  { code: 'BB4', name: 'First Step + Finishing', time: '60–75 min', summary: 'Warm-up 8; jab/first-step series 15; 1–2 dribble attacks 15; rim finishes 20; weak-hand 10; free throws 5', blocks: [
    { t: 'Warm-up · 8 min', items: [{ n: 'Dynamic basketball warm-up', d: 'Jog, skips, hip openers' }] },
    { t: 'Skill Block 1 · Jab + first step · 15 min', items: [{ n: 'Jab step series', d: '3 × 5/side' }, { n: 'Rip through first step', d: '3 × 5/side' }, { n: 'Jab crossover', d: '3 × 5/side' }] },
    { t: 'Skill Block 2 · 1–2 dribble attacks · 15 min', items: [{ n: 'One dribble attack to rim', d: '10/side' }, { n: 'Two dribble attack', d: '10/side' }] },
    { t: 'Game-Speed · Rim finishes · 20 min', items: [{ n: 'Power layup', d: '10 makes' }, { n: 'Euro step layup', d: '10 makes' }, { n: 'Reverse layup', d: '10 makes' }, { n: 'Inside hand layup', d: '10 makes' }] },
    { t: 'Finisher · Weak hand · 10 min', items: [{ n: 'Weak hand layups', d: '20 makes' }] },
    { t: 'Cooldown · 5 min', items: [{ n: 'Free throws', d: '5 min' }] }] },
  { code: 'BB5', name: 'PG Skills', time: '60–80 min', summary: 'Warm-up 8; pick-up simulation 15; change of pace 12; PnR footwork without screener 10; passing targets 10; pull-up/floaters 15', blocks: [
    { t: 'Warm-up · 8 min', items: [{ n: 'Dynamic basketball warm-up', d: 'Jog, skips, handles' }] },
    { t: 'Skill Block 1 · Pick-up + pace · 27 min', items: [{ n: 'Full court pressure dribble', d: 'Pick-up simulation 15 min vs chairs' }, { n: 'Change of pace dribble', d: '12 min' }] },
    { t: 'Skill Block 2 · PnR footwork · 10 min', items: [{ n: 'Pick and roll snake dribble', d: '5/side' }, { n: 'Reject the screen', d: '5/side' }, { n: 'Hesitation pull-up off screen', d: '5/side' }] },
    { t: 'Game-Speed · Passing targets · 10 min', items: [{ n: 'One hand push pass', d: 'Wall target 20/hand' }, { n: 'Pocket pass', d: '20' }, { n: 'Skip pass', d: '10/side to wall target' }] },
    { t: 'Finisher · Pull-ups + floaters · 15 min', items: [{ n: 'Pull-up jumper', d: '15 makes' }, { n: 'Floater', d: '15 makes' }] },
    { t: 'Cooldown', items: [{ n: 'Free throws', d: '5 min' }] }] },
  { code: 'BB6', name: 'Reaction + COD', time: '60–75 min', summary: 'Warm-up 10; visual/tennis-ball reaction 8; mirror footwork 10; 5-10-5 cone work 12; closeout-to-drive 15; finishing 10', blocks: [
    { t: 'Warm-up · 10 min', items: [{ n: 'Dynamic basketball warm-up', d: 'Jog, skips, shuffles' }] },
    { t: 'Skill Block 1 · Reaction · 8 min', items: [{ n: 'Tennis ball reaction drill', d: '4 × 30 sec' }, { n: 'Visual cue sprint', d: '5 reps' }] },
    { t: 'Skill Block 2 · Footwork · 22 min', items: [{ n: 'Mirror footwork drill', d: '10 min' }, { n: '5-10-5 shuttle', d: '12 min — cone work' }] },
    { t: 'Game-Speed · Closeout to drive · 15 min', items: [{ n: 'Closeout to drive', d: '4 × 5' }] },
    { t: 'Finisher · Finishing · 10 min', items: [{ n: 'Layup finishing package', d: '10 min' }] },
    { t: 'Cooldown', items: [{ n: 'Free throws', d: '5 min' }] }] },
  { code: 'BB7', name: 'Game-Speed Shooting', time: '60–75 min', summary: 'Warm-up 8; sprint-to-shot 15; relocation 15; transition threes 15; 1-minute makes 10; free throws 5', blocks: [
    { t: 'Warm-up · 8 min', items: [{ n: 'Dynamic basketball warm-up', d: 'Jog + form shooting' }] },
    { t: 'Skill Block 1 · Sprint to shot · 15 min', items: [{ n: 'Sprint to spot shooting', d: '5 spots × 4' }] },
    { t: 'Skill Block 2 · Relocation · 15 min', items: [{ n: 'Shot relocation drill', d: '5 × 1 min' }] },
    { t: 'Game-Speed · Transition threes · 15 min', items: [{ n: 'Transition three pointer', d: 'Both wings × 10' }] },
    { t: 'Finisher · 1-minute makes · 10 min', items: [{ n: 'One minute shooting drill', d: 'Record makes each round' }] },
    { t: 'Cooldown · 5 min', items: [{ n: 'Free throws', d: '5 min' }] }] },
  { code: 'BB8', name: 'Weak Hand + Touch', time: '60–70 min', summary: 'Warm-up 8; left-hand handles 15; weak-hand finishes 20; floaters 10; touch shots 10; free throws 5', blocks: [
    { t: 'Warm-up · 8 min', items: [{ n: 'Dynamic basketball warm-up', d: 'Jog, skips' }] },
    { t: 'Skill Block 1 · Left-hand handles · 15 min', items: [{ n: 'Weak hand dribbling drills', d: 'Pound, crossover, in-out' }] },
    { t: 'Skill Block 2 · Weak-hand finishes · 20 min', items: [{ n: 'Weak hand layups', d: '30 makes' }, { n: 'Weak hand reverse layup', d: '10 makes' }] },
    { t: 'Game-Speed · Floaters · 10 min', items: [{ n: 'Floater', d: '20 makes, both feet' }] },
    { t: 'Finisher · Touch shots · 10 min', items: [{ n: 'Hook shot', d: '10/side' }, { n: 'Bank shot', d: '10 makes' }] },
    { t: 'Cooldown · 5 min', items: [{ n: 'Free throws', d: '5 min' }] }] },
  { code: 'BB9', name: 'Game Simulation', time: '60–80 min', summary: 'Warm-up 10; 5 rounds: attack → COD → finish → sprint back; shooting under fatigue 20; clutch free throws 10', blocks: [
    { t: 'Warm-up · 10 min', items: [{ n: 'Dynamic basketball warm-up', d: 'Jog, skips, handles' }] },
    { t: 'Skill Block 1 · Game rounds', items: [{ n: 'Attack change of direction finish', d: '5 rounds: attack → COD → finish → sprint back' }] },
    { t: 'Skill Block 2 · Shooting under fatigue · 20 min', items: [{ n: 'Sprint and shoot drill', d: 'Sprint + 2 shots × 10' }] },
    { t: 'Game-Speed · Beat the clock', items: [{ n: 'Shot clock possessions', d: '10 × 12-sec possessions' }] },
    { t: 'Finisher · Clutch free throws · 10 min', items: [{ n: 'Free throws under fatigue', d: '2 FTs after each sprint' }] },
    { t: 'Cooldown', items: [{ n: 'Walk + stretch', d: '5 min' }] }] },
  { code: 'BB10', name: 'Light Skill / Recovery', time: '40–55 min', summary: 'Easy handles 15; form shooting 15; stationary passing 10; mobility 10; free throws 5. Keep intensity low.', blocks: [
    { t: 'Warm-up', items: [{ n: 'Easy jog + mobility', d: '5 min' }] },
    { t: 'Skill Block 1 · Easy handles · 15 min', items: [{ n: 'Stationary ball handling', d: '15 min, relaxed' }] },
    { t: 'Skill Block 2 · Form shooting · 15 min', items: [{ n: 'Form shooting', d: '15 min, close range' }] },
    { t: 'Game-Speed (low) · Passing · 10 min', items: [{ n: 'Wall passing drill', d: 'Stationary, 10 min' }] },
    { t: 'Finisher · Free throws · 5 min', items: [{ n: 'Free throws', d: '5 min' }] },
    { t: 'Cooldown · Mobility · 10 min', items: [{ n: 'Hip and ankle mobility', d: '10 min' }] }] },
  { code: 'BB11', name: 'Defense + Closeouts', time: '55–70 min', summary: 'Warm-up 10; defensive footwork 12; closeouts 12; game-speed closeout-slide-sprint 10; slide finisher 6; cooldown 5', blocks: [
    { t: 'Warm-up · 10 min', items: [{ n: 'Defensive stance hold', d: '3 × 30 sec' }, { n: 'Lateral lunge', d: '2 × 8/side' }] },
    { t: 'Skill Block 1 · Footwork · 12 min', items: [{ n: 'Zig zag defensive slides', d: '4 full-court trips' }, { n: 'Drop step and run', d: '3 × 4/side' }] },
    { t: 'Skill Block 2 · Closeouts · 12 min', items: [{ n: 'Closeout chop feet', d: '3 × 6' }, { n: 'Closeout contest box out', d: '3 × 5' }] },
    { t: 'Game-Speed · 10 min', items: [{ n: 'Closeout slide sprint', d: '6 reps — closeout → slide → sprint back' }, { n: 'Lane slides', d: '3 × 30 sec' }] },
    { t: 'Finisher · 6 min', items: [{ n: 'Sideline defensive slide shuttle', d: '4 × 30 sec · 30 sec rest' }] },
    { t: 'Cooldown · 5 min', items: [{ n: 'Free throws', d: '20 shots' }, { n: 'Adductor + hip stretch', d: '3 min' }] }] },
  { code: 'BB12', name: 'Transition + Conditioning', time: '55–70 min', summary: 'Warm-up 8; full-court pushes 12; transition shooting 12; 1-man fast breaks 12; court sprints 6; cooldown 5', blocks: [
    { t: 'Warm-up · 8 min', items: [{ n: 'Dynamic basketball warm-up', d: 'Jog, skips, build-ups' }] },
    { t: 'Skill Block 1 · Pushing pace · 12 min', items: [{ n: 'Full-court speed dribble layup', d: '10 per hand' }, { n: 'Outlet catch and push', d: '3 × 4' }] },
    { t: 'Skill Block 2 · Transition shooting · 12 min', items: [{ n: 'Transition pull-up three', d: '3 × 5 per wing' }, { n: 'Hit-ahead pass', d: '20 to a wall target' }] },
    { t: 'Game-Speed · 12 min', items: [{ n: 'One man fast break drill', d: '5 rounds: layup → return → pull-up' }] },
    { t: 'Finisher · 6 min', items: [{ n: 'Baseline-to-half court sprints', d: '6 × 20 sec · 40 sec rest' }] },
    { t: 'Cooldown · 5 min', items: [{ n: 'Free throws', d: '10 makes' }, { n: 'Walk + stretch', d: '3 min' }] }] },
  { code: 'BB13', name: 'Midrange + Footwork', time: '60–75 min', summary: 'Warm-up 8; pivot + jab series 15; midrange creation 15; elbow attacks 12; 20 midrange makes; cooldown 5', blocks: [
    { t: 'Warm-up · 8 min', items: [{ n: 'Dynamic basketball warm-up', d: 'Jog + form shooting' }] },
    { t: 'Skill Block 1 · Pivots + jab · 15 min', items: [{ n: 'Front and reverse pivot', d: '3 × 1 min' }, { n: 'Jab step jumper', d: '3 × 6/side' }] },
    { t: 'Skill Block 2 · Midrange creation · 15 min', items: [{ n: 'Pump fake one dribble pull-up', d: '3 × 6' }, { n: 'Stepback jumper', d: '3 × 5/side' }, { n: 'Elbow turnaround jumper', d: '3 × 5' }] },
    { t: 'Game-Speed · Elbow attacks · 12 min', items: [{ n: 'Triple threat attack', d: '4 × 5 from each elbow' }] },
    { t: 'Finisher', items: [{ n: 'Midrange shooting', d: '20 makes — track attempts' }] },
    { t: 'Cooldown · 5 min', items: [{ n: 'Free throws', d: '5 min' }] }] },
  { code: 'BB14', name: 'Pressure Handling + Ball Security', time: '55–70 min', summary: 'Warm-up 8; two-ball + spider 12; chair pressure break 12; tight-space handling 10; weak-hand full-court 6; cooldown 5', blocks: [
    { t: 'Warm-up · 8 min', items: [{ n: 'Dynamic basketball warm-up', d: 'Jog + stationary handles' }] },
    { t: 'Skill Block 1 · Control · 12 min', items: [{ n: 'Two-ball dribble series', d: '5 min' }, { n: 'Spider dribble', d: '3 × 30 sec' }] },
    { t: 'Skill Block 2 · Pressure break · 12 min', items: [{ n: 'Chair pressure break drill', d: '4 trips — retreat, crossover, split' }, { n: 'Arm bar dribble protection', d: '3 × 30 sec/side' }] },
    { t: 'Game-Speed · Tight space · 10 min', items: [{ n: 'Dribble box drill', d: '3 × 30 sec' }, { n: 'Tennis ball distraction dribble', d: '2 full-court trips' }] },
    { t: 'Finisher · 6 min', items: [{ n: 'Weak hand full-court speed dribble', d: '4 trips + layup' }] },
    { t: 'Cooldown · 5 min', items: [{ n: 'Free throws', d: '5 min' }] }] },
];

export const RECOVERY_ROUTINES = [
  { code: 'R-NECK', name: 'Neck / upper-body routine', items: ['Neck flexion isometric — 2 × 15–20 sec, gentle and pain-free', 'Neck lateral isometric — 2 × 15–20 sec/side', 'Chin tuck — 2 × 6 with 5-sec holds', 'T-spine extension — 2 × 6, slow'] },
  { code: 'R-ANKLE', name: 'Ankle / lower-leg routine', items: ['Ankle dorsiflexion rocks — 2 × 10/side', 'Soleus isometric — 2 × 30–45 sec', 'Tib raises — 2 × 15', 'Hip flexor stretch — 2 × 30 sec/side'] },
  { code: 'R-GUN', name: 'Massage gun', items: [] },
];

export const CHECKLIST = [
  ['steps', '10,000 steps'],
  ['protein', '160 g protein'],
  ['gym', 'Gym session (A–J) or emergency workout'],
  ['sport', 'Basketball / run replacement when scheduled'],
  ['plyo', 'Daily plyo micro-dose'],
  ['core', 'Morning core'],
  ['creatine', 'Creatine'],
  ['sleep', '8+ hours sleep target'],
  ['tomorrow', 'Write tomorrow’s first task'],
];

export const QUOTES = [["Michael Jordan", "I can accept failure. Everyone fails at something. But I can’t accept not trying."], ["Kobe Bryant", "Everything negative—pressure, challenges—is all an opportunity for me to rise."], ["Kobe Bryant", "The most important thing is to try and inspire people so that they can be great."], ["Kobe Bryant", "The moment you give up is the moment you let someone else win."], ["Michael Jordan", "I’ve failed over and over and over again in my life. And that is why I succeed."], ["Michael Jordan", "Obstacles don’t have to stop you."], ["Michael Jordan", "If you quit once it becomes a habit. Never quit."], ["LeBron James", "I like criticism. It makes you strong."], ["LeBron James", "You have to be able to accept failure to get better."], ["LeBron James", "I always say, decisions I make, I live with them."], ["Stephen Curry", "Success is not an accident."], ["Stephen Curry", "Be the best version of yourself in everything you do."], ["Stephen Curry", "Every time I rise up, I have confidence that I’m going to make it."], ["Giannis Antetokounmpo", "You can’t be afraid to fail. It’s the only way you succeed."], ["Giannis Antetokounmpo", "Greatness is not measured by what you accomplish."], ["Kevin Garnett", "Anything is possible!"], ["Kevin Garnett", "We have to be relentless."], ["Allen Iverson", "I’m not perfect. But I’m trying."], ["Allen Iverson", "I just try to be myself."], ["Magic Johnson", "All kids need is a little help, a little hope and somebody who believes in them."], ["Larry Bird", "I’ve got a theory that if you give 100% all of the time, somehow things will work out in the end."], ["Bill Russell", "The most important measure of how good a game I played was how much better I’d made my teammates play."], ["Dwyane Wade", "I’ve always wanted to be a better player."], ["Chris Paul", "I just try to play every game like it’s my last."], ["Damian Lillard", "I’m going to keep working until I get it right."], ["Tim Duncan", "Good, better, best. Never let it rest."], ["Shaquille O’Neal", "Excellence is not a singular act but a habit."], ["Kawhi Leonard", "I’m just trying to get better every day."], ["Russell Westbrook", "Why not?"], ["Michael Phelps", "You can’t put a limit on anything. The more you dream, the farther you get."], ["Muhammad Ali", "Don’t count the days; make the days count."], ["Muhammad Ali", "I hated every minute of training, but I said, “Don’t quit.”"], ["David Goggins", "We should never feel that we have arrived."], ["David Goggins", "When you think you are done, you’re only at 40 percent."], ["Usain Bolt", "I trained 4 years to run 9 seconds and people give up when they don’t see results in 2 months."], ["Serena Williams", "Luck has nothing to do with it."], ["Serena Williams", "A champion is defined not by their wins but by how they can recover when they fall."], ["Rafael Nadal", "If you don’t lose, you cannot enjoy the victories."], ["Rafael Nadal", "I am a very positive person."], ["Roger Federer", "You have to believe in the long term."], ["Tom Brady", "I didn’t come this far to only come this far."], ["Tiger Woods", "No matter how good you get, you can always get better."], ["Simone Biles", "I’d rather regret the risk that didn’t work out than the chances I didn’t take at all."], ["Manny Pacquiao", "The test of a champion is not whether he can triumph but whether he can overcome obstacles."], ["Conor McGregor", "We’re not here to take part; we’re here to take over."], ["Floyd Mayweather Jr.", "I’m going to work hard and I’m going to do my best."], ["Mike Tyson", "Discipline is doing what you hate to do, but nonetheless doing it like you love it."], ["Alex Honnold", "The most important thing is to focus on what you can control."], ["Eliud Kipchoge", "Only the disciplined ones are truly free in life."], ["Eliud Kipchoge", "No human is limited."], ["Novak Djokovic", "The more you work on yourself, the better you become."], ["Kelly Slater", "The more you practice, the luckier you get."], ["Arnold Schwarzenegger", "The worst thing I can be is the same as everybody else."], ["Dwayne Johnson", "Success isn’t always about greatness. It’s about consistency."], ["Ronnie Coleman", "Everybody wants to be a bodybuilder, but nobody wants to lift no heavy-ass weights."], ["Rich Froning", "I don’t have to be great at everything, but I have to be great at the things I’m supposed to be great at."], ["Mat Fraser", "I think the biggest thing is just being consistent."], ["Kobe Bryant", "The beauty in being blessed with talent is rising above doubters to create a beautiful moment."], ["Kobe Bryant", "We can always kind of be average and just do what’s normal. I’m not in this to do what’s normal."], ["Michael Jordan", "Talent wins games, but teamwork and intelligence wins championships."], ["Michael Jordan", "Some people want it to happen, some wish it would happen, others make it happen."], ["LeBron James", "I’m going to use my speed, my strength, my size, my basketball IQ."], ["Giannis Antetokounmpo", "It’s not about the destination, it’s about the journey."], ["Kevin Durant", "Hard work beats talent when talent fails to work hard."], ["Carmelo Anthony", "I’ve been working hard since I was young."], ["Chris Paul", "I’m not trying to be perfect. I’m trying to be better."], ["Derrick Rose", "You can’t be afraid of what people are going to say about you."], ["Jrue Holiday", "You have to stay locked in."], ["Jimmy Butler", "I’m just trying to be the best version of myself."], ["Damian Lillard", "You can’t fake hard work."], ["Kobe Bryant", "The biggest thing is to try and inspire people."], ["Kobe Bryant", "If you are afraid to fail, then you’re probably going to fail."], ["Michael Jordan", "Always turn a negative situation into a positive situation."], ["Michael Jordan", "I never looked at the consequences of missing a big shot."], ["LeBron James", "I’m going to keep pushing."], ["Stephen Curry", "I’ve never been afraid to fail."], ["Michael Phelps", "If you want to be the best, you have to do things that other people aren’t willing to do."], ["Muhammad Ali", "He who is not courageous enough to take risks will accomplish nothing in life."], ["David Goggins", "Suffering is a test of your will."], ["David Goggins", "Motivation is crap."], ["Usain Bolt", "I have trained hard and I have achieved what I wanted."], ["Serena Williams", "Every woman’s success should be an inspiration to another."], ["Rafael Nadal", "I’m going to fight until the end."], ["Roger Federer", "I always believe if you’re stuck in something and you need a change, you have to change."], ["Tom Brady", "If you don’t play to win, don’t play at all."], ["Tiger Woods", "There is no such thing as perfect golf."], ["Simone Biles", "I don’t think I’ve ever had a day where I’ve felt like I’ve had it all figured out."], ["Eliud Kipchoge", "The best time to plant a tree was 20 years ago. The second best time is now."], ["Novak Djokovic", "The greatest weapon is a calm mind."], ["Conor McGregor", "There is no talent here, this is hard work."]];
