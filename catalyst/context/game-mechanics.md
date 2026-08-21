# Game Mechanics — Dispatch

A **context document** (`references/context-documents.md`), project-specific: the reference for the game **Dispatch** that every hero stat, power, synergy pair, and rule in this app is transcribed from. The game itself is the upstream source of truth; when in-game behavior disagrees with this file, the file is corrected. Never change game data from memory — check it against this document.

**Loads when:** adding or changing hero data, powers, synergy pairs, dispatch/scoring rules, or any feature whose correctness is defined by the game — and when drafting or reviewing a feature document that encodes game mechanics.

## About

Dispatch is an episodic adventure game developed and published by the American developer AdHoc Studio. Described as a superhero workplace comedy, Dispatch has the player take the role of Robert Robertson III, formerly the superhero Mecha Man, who has to take a job as a dispatcher for villains-turned-superheroes after his signature mecha suit is destroyed in battle.

## Gameplay

Dispatch is an adventure video game, where the player's choices affect the story via the use of dialogue trees in conversations with other characters. A large form of the gameplay consists of navigating a superhero team across the Superhero Dispatch Network (SDN) map to crimes and events, where the player must strategically decide which hero or heroes best fit the activity based on their stats and character traits, while also managing their cooldowns. In the hacking mini-game, the player must quickly navigate pathways and complete quick time events.

## Setting

Dispatch is set in an alternate Los Angeles where super-powers - and consequently superheroes and supervillains - are commonplace and thus have divided society between "supers" (those born with powers such as flight and invisibility or born with a different appearance) and "normies" (those devoid of superpowers). While there are independent superheroes, several of them work for the Superhero Dispatch Network (SDN), which provides services and protection for their subscribers.

## Z-Team

The Phoenix Program, also known as the Z-Team, is a special rehabilitation program run by the Superhero Dispatch Network where supervillains and anti-heroes sign up to help out SDN subscribers in the hopes of becoming heroes.

At SDN, eight former villains were chosen from those who signed up and placed on the Z-Team. However, owing to the team's less than welcoming approach to every dispatcher assigned to them, such as Flambae setting one dispatcher's car on fire, they tend to quit in droves. As a result of this and less than optimal results, the program is on the verge of being shut down.

A few days into Robert becoming the team's newest dispatcher, Blonde Blazer, the HR Manager of the branch, makes the tough decision to let go of the lowest achieving member of the team at the end of the day. This results in the field agents sabotaging each other to stay ahead and a resulting conference meeting where Robert tells them off for getting in each other's way after this, they cooperate except for Invisigal who refuses all dispatches due to her beliefs of fating intertwined with powers one is born with. Miraculously, after Robert encourages her, she had a last-minute encounter with Lightningstruck and managed to capture and bring in the criminal, nudging her up on the leaderboard. However, this now meant there was a tie for the bottom: Coupé and Sonar. As a result, one of them was let go.

As this then left the team short-staffed, Blonde Blazer then put forward two possible candidates to fill the slot: Waterboy, who was a hero in training, or Phenomaman, a superhero who was on indefinite leave from his own branch as he wasn't taking his break-up with Blonde Blazer very well.

Later, Invisigal sets up a housewarming party at Robert's apartment to organize how to steal back the Astral Pulse, but the party comes to a stop when Invisigal and Chase argue about the other's reputation and she punches him. If the player chose to have Robert reveal his identity earlier, Chase will mention it during the argument, shocking every member except Flambae who comes late.

After Invisigal decided to steal back the Astral Pulse by herself which led to Chase's hospitalization, the other Z-Team members held a meeting in which the majority of them felt that Invisigirl's actions were reckless and put the team's credibility at risk. Excluding Golem, the members want Invisigal to be cut from the team. Flambae will side with Invisigal if Robert revealed he is Mecha Man, and Phenomaman will abstain if he is recruited. Robert either decides to honor their request and permanently remove Invisigal from the team or refuse and continue her temporary suspension.

During the final dispatch, the high number of calls leads Robert into convincing the hero he didn't recruit earlier, Phenomaman or Waterboy, into joining the team. It is also revealed that whoever was cut, Coupé or Sonar, turned back into being a super villain and joined the Red Ring. During the final stage of the dispatch, if one mission's probability check fails, the probability ball automatically moves back into the area of success to reveal Blonde Blazer helping that call and joining the roster.

## Dispatching

One of the core game mechanics in Dispatch is effectively and quickly dispatching heroes to help around the city.

As the player works a shift, they will receive various calls from SDN subscribers seeking assistance, for both small situations, like getting a balloon out of a tree, to large escalations, like rescuing people from a fire. It is the dispatcher's job will be to try and assign the best suited hero available and to make sure all calls are handled (and ideally done successfully).

### Answering calls

When a call comes in, there will be a limited amount of time to pull it up and assign a hero. Clicking on the call will cause time will pause to allow the player to read over the briefing and see what kind of assistance they need. Keywords will stand out that indicate the optimal stat(s) needed as well as any other possible factors.

It is important to note it is not immediately necessary to assign a hero right away: the player can exit out from it to view others on the map or let time continue. A small auditory countdown rings before the call auto-fails.

### Competing calls

Unlike regular calls, a set of special calls that directly conflict with each other will appear together, as indicated by a pink icon with a hand showing two talk bubbles: an X and a check mark. Like other calls, there is a countdown on which one to pick, but unlike regular calls, the player can only pick one option, with the other going away once a decision is dispatched. In these situations, the reward for each choice will be shown in the briefing (such as XP for a particular hero if they're sent vs. some XP split across the entire Z-Team).

### Hack calls

Occasionally, the player receives a call where no heroes are dispatched, but Robert must hack in order to resolve the call.

### Assigning heroes

When a call comes in, the player will need to select a hero from the available roster and dispatch them. Certain calls may allow assigning more than one hero, though it is possible to still send fewer than allowed, particularly if their powers add some benefit to this setup (such as Invisigal's allowing her to work faster alone).

When a hero is assigned, their status will change to "busy" as they make their way there and complete the task. Afterwards, they'll change to "returning" as they head back to SDN's HQ. Once back, they'll enter a small "resting" period where they can't be assigned out until they've recovered. A draining green meter above a hero's profile indicates how much time is left before they are ready again. The player needs to review the results of the call before the hero dispatched on that can be assigned out again as well (even if they've recovered).

Calls will come in throughout the shift, often overlapping with others. As heroes need time to rest after they return to SDN's HQ, this means the optimal hero may not be available in time if already out on a call, returning, or resting. This creates a balancing between accepting calls near expiration to wait for the appropriate hero to be available or compromising and using other heroes that may still get the job done.

There are certain calls where a hero may ask to be assigned specifically and will remember if allowed to be dispatched or not, given that they are available at the time of accepting the call. Other times, a hero will automatically take a call for themselves to handle, unable to be removed. Conversely, some calls may prevent a certain hero from being assigned to them.

### Stats summary

To read more about stats, see "Stats" section below.

Each hero and call will rely on stats to help determine the outcome. These stats are: Combat, Intellect, Vigor, Charisma, and Mobility. It is usually impossible know the full extent of the stats needed for a situation, but the information highlights keywords to determine the best suited hero for the job. For example, convincing a group of people typically requires for high intellect and charisma over mobility and vigor.

When a call allows more for than one hero to be dispatched, the stats of all of the dispatched heroes will be summed for bigger stats and increased chances of success.

### Intervening

In certain situations, the player will be alerted to an assigned call that needs the dispatcher's attention, as indicated by a red hand stop sign. This also has a countdown.

For these, the hero needs the player to pick an option on how to proceed in the situation. Picking on an option will focus on a single stat rather than the sum of all stats to determine the chance a mission succeeds.

There are also certain calls that allow a certain hero to resolve it themselves if that hero was chosen to be dispatched on that call.

### Scoring

After a hero finishes a call, the player will need to review it before the heroes that were dispatched on that call can be assigned again after resting. Depending on the type of call and situation, there are several different ways in how an outcome is decided.

For basic situations where the stat chart is shown in full when reviewing, the call's chart appears in white before the assigned hero's/heroes' overall stats overlaps it in orange. If the call's chart fits perfectly within the hero's chart, it'll give a 100% and be successful. Otherwise, the score is calculated by how much overlap there is and then a moving marker that bounces around the call's white outlined area. If it lands on an overlapping area with the hero's, it'll be successful. Otherwise, if it lands in an area where the hero's chart doesn't overlap it, it'll fail. This can lead to some risky chances as a hero in one playthrough may succeed while in another, fail.

For situations where intervention was required, these will instead rely on one particular stat related to the scenario. When picking an option on how to proceed, the call will show the state needed to be successful before the hero's stat appears. If the hero's/heroes' chosen state matches or exceeds the call's number, it will be successful.

In intervening situations where hero-specific choices are available, this will result in a fixed result, usually successful, without the need to check the hero's stat. However, conversely, some missions that allow a certain hero to resolve it may result in an automatic failure, such as sending Flambae to take out a fire or sending Waterboy to stop a flooding, both who can create the element they are associated with but not absorb it.

No matter how it's scored, if successful, the hero(es) that were assigned see an immediate XP reward, indicated by a number that appears for a brief time over the star icon on their profile picture. Heroes also receive XP from calls they were dispatched on, but have an interference where the option chosen was to hack.

## Hero Training

Hero Training is a gameplay mechanic in Dispatch.

### Hero Power Training

Hero Power Training is a special set of powers that are unique to each hero. Each hero starts with one power, but it needs to be revealed to the player by triggering its condition (e.g. for Malevola to heal somebody, she needs to be sent on a call together with another hero who is injured). Another one can be unlocked from a choice of two options. Some powers override/upgrade the hero's starting power. Blonde Blazer only has her starting power.

Coupé:

- En Pointe (starting): In 2+ slots calls, if placed in the first slot, Coupé gains +1 Combat. If placed in the second slot, she gains +1 Mobility.
- Pirouette: If Coupé is sent on a call that fails, she will reattempt it.
- À la Seconde (override): If placed in the first slot, Coupé now gains +3 Combat. If placed in the second slot, she now gains +3 Mobility.

Flambae:

- On Fire (starting): After success, Flambae gains +1 Combat and +1 Mobility. This effect stacks. All boosts reset after a failure.
- Comet: After a success, Flambae also reduces call completion and travel time. If after two successes Flambae fails a third, he is downed.
- Supernova (override): Succeeding twice will set Flambae's Combat and Mobility to max and removes rest time. After a fail, Flambae's stats drop to 1.

Golem:

- Diamond in the Rough (starting): When Golem is in a call with 2+ slots, certain ones may grant +2 to a stat and -1 to others when he's assigned.
- Spread Thin: Golem expands to fill each empty slots, increasing his stats by 25% per slots up to 200% when beneficial.
- Found Himself: Once per shift, all of Golem stats can be reset within the hero Database, allowing for redistribution of points.

Invisigal:

- Lone Wolf (starting): When sent alone, Invisigal reduces travel time and call completion time.
- Ear to the Ground: With her connections, Invisigal can reveal the number of slots and crime type on hover for certain calls before they happen.
- Wolf Pack: If Invisigal is on the team, XP rewards are doubled.

Malevola:

- Life Trade (starting): Malevola heals one hero when sent on a call together. She then receives +1 Charisma or Vigor. This effect stacks.
- Life Trade Visions: After healing a hero, Malevola also reveals the stats of the next call she's assigned to.
- Portal Ritual: After healing a hero, Malevola also creates a portal near the call once per shift. The portal lasts 45 seconds after call completion.

Phenomaman:

- Easily Depressed (starting): Phenomaman needs only 2 seconds rest, however if any call fails or misses, he will be depressed and need 45 seconds of rest.
- Heavily Medicated (override): Phenomaman will lose his ability to fly when responding and rests for 8 more seconds than usual, but no longer can become depressed.
- Phenomenal Motivation: Heroes sent with Phenomaman have their rest time reduced by half if he completes the call with them.

Prism:

- Doppelganger Illustion (starting): When assigned to a call, Prism duplicates the hero to her left, placing their illusion in an empty slot with half their stats.
- Perfect Copy (override): Prism's duplicated illusions now have the full stats of the copied hero.
- Longe Range Illusion: When a call is about to expire, Prism creates an illusion that keeps the call up for a few more seconds. This happens once per shift.

Punch Up:

- Hard Head (starting): Punch Up doesn't receive any debuffs from injuries. He cannot be downed.
- Squeeze In: On a call with <4 slots, Punch Up creates a slot exclusively for him to join.
- Harder Head: While Punch Up is injured, he receives +2 Combat, +2 Vigor, and reduces rest time.

Sonar:

- Instincts (starting): Sonar transforms after returning from a call. His Intellect swaps with Combat and his Charisma swaps with Vigor until the next call.
- Bat Shit: In Mega Bat form, Sonar is immune to injuries and his resting time is reduced by half.
- Talk Shit: When in Hybrid form, if Sonar is sent to a call that fails, he will talk his way out and reattempt the call.

Waterboy:

- Eager Sponge (starting): Waterboy assigns himself when not sent often. He gains +1 to the highest stat for the call. He can only be removed once.
- Eager Super Sponge (override): Waterboy now gains +3 to the highest stat for that call.
- Holy Water Spit: Waterboy no longer assigns himself. Waterboy will heal up to two heroes when sent on a call together.

Blonde Blazer:

- Radiant Light (starting): All heroes that pass through Blazer's radiant light gain a protective shield that defends them against one injury.

### Flight School

On occasion, Blonde Blazer will bring up the opportunity during calls that the flight-capable Z-Team members need to get their license in order to fly. You can only send one during such a call to get theirs. When you get the first call, it'll be during Episode 3 (the second day's shifts) in the second half of the day. The three flight-capable members are:

- Coupé - En L'air: Coupé flies to call locations, greatly reducing travel time.
- Flambae - Flybae: Flambae flies to call locations, greatly reducing travel time.
- Sonar - Strong Back: If transformed, Sonar flies to call locations, greatly reducing travel time. He also carries non-flying heroes.

Phenomaman starts with the ability to fly (Fly-Nomenal), as does Blonde Blazer (though it doesn't have a specific name).

## Stats

Stats are the main mechanic that decides the outcome of a call in Dispatch.

There are 5 stats in the game:

- Combat
- Intellect
- Vigor
- Charisma
- Mobility

Each of these stats affect how a hero is likely (or unlikely) to succeed in an assigned call. As a hero levels up, Skill Points are earned to help increase these stats.

The heroes start with the following stats:

| Hero      | Coupé | Flambae | Golem | Invisigal | Malevola | Phenomaman | Prism | Punch Up | Sonar | Waterboy | Blonde Blazer |
| --------- | ----- | ------- | ----- | --------- | -------- | ---------- | ----- | -------- | ----- | -------- | ------------- |
| Combat    | 4     | 4       | 3     | 3         | 3        | 7          | 4     | 3        | 2     | 1        | 8             |
| Intellect | 3     | 1       | 1     | 2         | 2        | 1          | 2     | 1        | 4     | 2        | 7             |
| Vigor     | 1     | 2       | 4     | 2         | 2        | 7          | 1     | 4        | 1     | 2        | 8             |
| Charisma  | 1     | 2       | 2     | 1         | 3        | 2          | 4     | 3        | 3     | 1        | 6             |
| Mobility  | 3     | 3       | 2     | 3         | 2        | 6          | 1     | 1        | 2     | 2        | 7             |

Most* heroes start at level 1 with 12 points worth of fixed stats (Invisigal 11, Waterboy 8) and are able to receive 9 bonus points to distribute as they wish for each level up. Additionally, up to 4 bonus points can be earned through dispatcher leveling up and these can be assigned in addition to the regular hero level up bonus points. The points awarded for dispatcher leveling up are random.

\* - Phenomaman and Blonde Blazer start at levels 12 and 20 respectively and are unable to level up further or be assigned bonus points.

### Upgrading

After a hero levels up, you can then go into the hero database (the folder icon on the right of the map) and view the "Upgrade" tab (top left) to select what to increase. Note that once you confirm a change, this cannot be reverted.

All heroes reach level 2 at 1000 gained XP, and every subsequent level has an added 300 XP to reach. The only exceptions being Invisigal, who reaches level 2 at 700 and Waterboy who reaches level 2 at 400.

### Dispatching outcomes

Each hero and call will rely on stats to help determine the outcome. You won't know the full extent of the stats needed for a situation, so you need to carefully assess the information/keywords it provides to determine the best suited hero for the job.

With certain calls where you can send more than one hero, the stats will be combined to get bigger stat numbers and potentially a better outcome.

### Injuries

Sometimes, if a hero fails at a call, they can be injured. If this happens, all their stats will decrease by 1. Injuries can also stack such that if they're still injured and they get injured again, they'll become downed.

## Synergy

Synergy is a gameplay factor that allows for a major increase in success chance when certain heroes are sent together in Dispatch. It is available beginning the second dispatch in episode 3.

### Mechanics

After Robert berates the Z-Team for sabotaging each other to avoid being cut for underperforming, the player can pair up certain characters up during the second shift that day to increase the chances a mission succeeds. These pair also not sabotage each other when sent together during the first shift.

After activating synergy for the first time, synergistic pairs will increase the chances of a mission passing by 5%, up to 15% at max level (3); synergy levels can be increased by sending synergy pairs out together as much as possible.

This can be used when their combined stats alone do not suffice to cover all the required stats to pass the mission without fail. For example, if a synergy pair whose synergy level stands at level 2 is dispatched on a mission, and the pair's stats only cover 90% of the required stats, their synergy level will increase the chance of success by 10%, effectively making the chance 100% and skipping the success check.

### Synergy Pairs

Currently, there are eight combinations of characters that will result in synergy. The first initial four are:

- Golem and Invisigal
- Prism and Flambae
- Malevola and Sonar
- Punch Up and Coupé

The fifth replacement pair is dependent on the member the player cuts in Episode 3 and the member the player adds to the Z-Team in Episode 4. See "Effects" below for more info.

- Malevola and Phenomaman
- Malevola and Waterboy
- Punch Up and Phenomaman
- Punch Up and Waterboy

### Effects

At the end of Episode 3, the player must choose to let go of either Coupé or Sonar. Whoever is chosen, their closest comrade (Punch Up or Malevola respectively) will act out in the following episode by pulling a prank, refusing to take certain calls, making snide remarks, before eventually leaving early for the first shift.

Before the second shift, Blonde Blazer presents Robert two choices to pick from to add to the team: Phenomaman or Waterboy. Whoever the player picks will then fill in as the new synergistic partner for whichever team member (Punch Up or Malevola) lost theirs.
