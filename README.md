# Heartglass: Across the Veil

A browser-based, choice-driven fae romance game designed for GitHub Pages.

## Play structure

- The player is gender-neutral and is referred to with **they/them** pronouns when spoken about.
- At the beginning, the Heartglass asks whether their heart is drawn toward a man or a woman.
- This selects the male dateable **Caelan** or the female dateable **Caelia**. They are twin-like gender variants of the same core character and share the same route.
- The relationship begins at **Neutral** and can move toward:
  - Enemies — bad ending
  - Neutral — neutral ending
  - Friends — friend ending
  - Romance — girlfriend/boyfriend ending
  - Engaged — proposal ending
  - Marriage — hidden best ending

## Important gameplay rules

- Choices are **irreversible within a playthrough**.
- Each scene can score only once, so refreshing or clicking repeatedly cannot farm approval.
- Progress autosaves in the browser using `localStorage`.
- Reloading the page returns the player to their current scene/reaction, not to the previous choice.
- The only normal way to redo earlier choices is **Restart Story**, which erases the current run and starts again at the antique shop.
- Discovered endings are stored separately and remain unlocked after restarting.
- The marriage ending is hidden until discovered.

Because this is a static GitHub Pages game, a technically knowledgeable player could still edit their own browser storage or source code. Preventing deliberate developer-tools cheating would require a server-side save system. Normal gameplay is locked down.

## Files

- `index.html` — game interface
- `style.css` — responsive visual-novel styling and location backgrounds
- `game.js` — story, relationship logic, autosave, route locking, ending logic
- `assets/sprites/` — transparent character sprites

## Sprite names

### Caelan

- `male_neutral.png`
- `male_smile.png`
- `male_laugh.png`
- `male_sad.png`
- `male_disappointed.png`
- `male_angry.png`
- `male_blush.png`
- `male_love.png`
- `male_wedding.png`

### Caelia

- `female_neutral.png`
- `female_smile.png`
- `female_laugh.png`
- `female_sad.png`
- `female_disappointed.png`
- `female_angry.png`
- `female_blush.png`
- `female_love.png`
- `female_wedding.png`

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload **the contents of this folder** so `index.html` is at the repository root.
3. Open the repository's **Settings**.
4. Open **Pages**.
5. Under *Build and deployment*, choose **Deploy from a branch**.
6. Select your main branch and `/ (root)`.
7. Save. GitHub will provide the public game URL after deployment.

No build step, package manager, framework, login, API key, or external web service is required.

## Save reset during testing

If you are testing locally and want to completely erase both the current run and discovered endings, open the browser console and run:

```js
localStorage.removeItem("heartglass_run_v1");
localStorage.removeItem("heartglass_meta_v1");
location.reload();
```

The in-game **Restart Story** button intentionally preserves discovered endings.
