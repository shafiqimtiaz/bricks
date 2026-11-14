import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const origin = process.env.QA_BASE_URL || "http://127.0.0.1:8787";
const browser = await chromium.launch();
const pages = [];
const errors = [];

async function pageAt(context, path) {
  const page = await context.newPage();
  pages.push(page);
  page.on("pageerror", error => errors.push(`${path}: ${error.message}`));
  const response = await page.goto(origin + path, { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200, `GET ${path}`);
  return page;
}

async function waitFor(page, expression) {
  await page.waitForFunction(expression, undefined, { timeout: 15000 });
}

try {
  const soloContext = await browser.newContext({ viewport: { width: 320, height: 720 } });
  const solo = await pageAt(soloContext, "/");
  // No home screen: / opens straight into the Solo game.
  assert.equal(await solo.locator("#homeLobby").count(), 0, "Solo has no home screen");
  assert.equal(await solo.locator("#c").count(), 1, "Solo renders one canvas");
  assert.ok(await solo.locator("canvas:visible").count() > 0, "Solo rendering canvas is visible");
  const soloOverflow = await solo.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(soloOverflow <= 1, `Solo has ${soloOverflow}px horizontal overflow at 320px`);

  const hostContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const host = await pageAt(hostContext, "/multiplayer");
  await host.locator("#playerName").fill("QA Host");
  await host.locator("#create").click();
  await waitFor(host, () => /^[A-Z2-9]{6}$/.test(document.querySelector("#roomCode")?.textContent || ""));
  const code = (await host.locator("#roomCode").textContent()).trim();
  assert.equal(await host.locator("#currentName").textContent(), "QA Host");
  const hostedArena = await host.evaluate(async code => {
    const response = await fetch("/api/multiplayer/rooms/" + code + "/state");
    return (await response.json()).state.arena;
  }, code);
  assert.equal(hostedArena.width, Math.round(640 * 390 / 844), "Host screen ratio determines multiplayer world");
  assert.equal(await host.locator("#room").isVisible(), true, "Host stays in waiting lobby");

  const guestContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const guest = await pageAt(guestContext, `/multiplayer/${code}`);
  await guest.locator("#inviteDetails").waitFor({ state: "visible" });
  assert.equal(await guest.locator("#playerName").inputValue(), "", "New invitee may enter a name later");
  await guest.locator("#acceptInvite").click();
  await waitFor(guest, () => /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(document.querySelector("#currentName")?.textContent || ""));
  assert.equal(await guest.evaluate(() => localStorage.getItem("brick-asmr-name-confirmed")), null, "Generated name is not persisted");
  await guest.locator("#editName").click();
  await guest.locator("#nickname").fill("QA Guest");
  await guest.locator("#saveName").click();
  await waitFor(guest, () => document.querySelector("#currentName")?.textContent === "QA Guest");
  assert.deepEqual(await guest.evaluate(() => [
    localStorage.getItem("brick-asmr-player-name"), localStorage.getItem("brick-asmr-name-confirmed")
  ]), ["QA Guest", "1"], "A chosen name is saved for future games");
  const returnVisit = await pageAt(guestContext, "/multiplayer");
  assert.equal(await returnVisit.locator("#playerName").inputValue(), "QA Guest", "Returning players reuse their chosen name");
  await waitFor(host, () => document.querySelector("#playerCount")?.textContent?.includes("2 PADDLES"));
  await waitFor(guest, () => document.querySelector("#playerCount")?.textContent?.includes("2 PADDLES"));
  assert.equal(await host.locator("#statusText").textContent(), "MULTIPLAYER LOBBY", "Two connected players remain in lobby until host starts");
  assert.equal(await host.locator("#start").isEnabled(), true, "Host can explicitly start");
  await host.locator("#start").click();
  await waitFor(host, () => document.querySelector("#statusText")?.textContent === "LIVE MATCH");
  await waitFor(guest, () => document.querySelector("#statusText")?.textContent === "LIVE MATCH");
  assert.equal(await host.locator("#slot0.me").count(), 1, "Host views their paddle at bottom");
  assert.equal(await guest.locator("#slot0.me").count(), 1, "Guest views their paddle at bottom");
  assert.equal(await host.locator("#c").count(), 1, "Host has one shared board");
  assert.equal(await guest.locator("#c").count(), 1, "Guest has one shared board");
  const reopenedLobby = await pageAt(hostContext, "/multiplayer");
  assert.equal(await reopenedLobby.locator("#intro").isVisible(), true, "Entering multiplayer shows the lobby with an active room cookie");
  assert.equal(await reopenedLobby.locator("#room").isVisible(), false, "No silent room resume");
  assert.equal(new URL(reopenedLobby.url()).pathname, "/multiplayer");
  await host.locator("canvas:visible").first().click({ position: { x: 30, y: 100 } });
  await guest.locator("canvas:visible").first().click({ position: { x: 30, y: 100 } });
  await host.keyboard.press("ArrowRight");
  await guest.keyboard.press("ArrowLeft");
  assert.deepEqual(errors, [], "Browser console has no uncaught page errors");
  console.log("Browser smoke passed: Solo, mobile layout, invite, 2-player round, own POV, paddle inputs");
} catch (error) {
  await mkdir("qa-artifacts", { recursive: true });
  await Promise.all(pages.map((page, index) => page.screenshot({ path: `qa-artifacts/page-${index}.png`, fullPage: true }).catch(() => {})));
  if (errors.length) console.error("Page errors:\n" + errors.join("\n"));
  throw error;
} finally {
  await browser.close();
}
