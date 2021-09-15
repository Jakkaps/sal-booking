import puppeteer from "puppeteer";
import { config } from "dotenv";
import days from "./days.js";
import {
  dateToDateString,
  dateToWeekDay as dateToWeekday,
} from "./dateHelpers.js";
config();

async function feideLogin(page) {
  await page.type(
    'input[placeholder="Search or choose from the list"]',
    "NTNU"
  );
  const [button] = await page.$x('//*[contains(text(), "NTNU")]');
  await button.click();
  await Promise.all([
    page.waitForNavigation(),
    await page.click("button[type=submit]"),
  ]);
  await page.type("input[id=username]", process.env.FEIDE_USERNAME);
  await page.type("input[id=password]", process.env.FEIDE_PWD);
  await page.click("button[type=submit]");
}

async function selectFromDropDown(page, spanTitle, itemName) {
  await page.click(`span[title=${spanTitle}]`);
  await page.type("input[type=search]", itemName);
  page.keyboard.press("Enter");
}

async function selectDate(page, date) {
  const dateString = dateToDateString(date, true);
  await page.$eval(
    "input[title=Dato]",
    (el, dateString) => (el.value = dateString),
    [dateString]
  );
}

async function book(room, date, fromHourString, toHourString) {
  const browser = await puppeteer.launch({ slowMo: 10 });
  const page = await browser.newPage();
  await page.goto("https://tp.uio.no/ntnu/rombestilling/");
  await feideLogin(page);
  await page.waitForNavigation();

  // Abort if point is already booked or there are 8 bookings already
  await Promise.all([
    page.click('a[href="./?mybookings=true"]'),
    page.waitForNavigation(),
  ]);

  const { numberOfBookings, currentBooked } = await page.evaluate(
    (fromHourString, toHourString, dateString) => {
      const trs = Array.from(document.querySelectorAll("tr[class=booked]"));
      let currentBooked = false;

      trs.forEach((tr) => {
        const liTexts = Array.from(tr.querySelectorAll("li")).map(
          (li) => li.innerText
        );
        const sameDate = liTexts.includes(dateString);
        console.log(dateString, sameDate);
        const sameTime = !!tr.querySelector(
          `td[data-sort='${fromHourString}-${toHourString}']`
        );
        currentBooked = currentBooked || (sameTime && sameDate);
      });

      return {
        numberOfBookings: trs.length,
        currentBooked,
      };
    },
    fromHourString,
    toHourString,
    dateToDateString(date)
  );

  if (numberOfBookings >= 8 || currentBooked) {
    browser.close();
    return;
  }

  // Go back to correct page
  await Promise.all([page.click('a[href="./"]'), page.waitForNavigation()]);

  // Fill in booking information
  page.click("input[title=Plassbestilling]");
  await selectDate(page, date);
  await selectFromDropDown(page, "Start", fromHourString);
  await selectFromDropDown(page, "Slutt", toHourString);
  await selectFromDropDown(page, "Område", "Gløshaugen");
  await selectFromDropDown(page, "Bygning", "Realfagbygget");
  await selectFromDropDown(page, "Romtype", "Lesesal");
  await page.screenshot({ path: "screenshot.png" });
  await Promise.all([
    page.waitForNavigation(),
    page.click("button[type=submit]"),
  ]);

  // Select correct
  const [correctRoom] = await page.$x(`//label[contains(text(), "${room}")]`);
  await correctRoom.click();
  await Promise.all([
    page.waitForNavigation(),
    page.click("button[id=rb-bestill]"),
  ]);
  await Promise.all([
    page.waitForNavigation(),
    page.click("button[name=confirm]"),
  ]);

  browser.close();
}

async function run(days) {
  const today = new Date();
  let dateIncrementIndex = 1;

  while (true) {
    const date = new Date(today.getTime());
    date.setHours(date.getHours() + 24 * dateIncrementIndex);
    dateIncrementIndex++;

    if (date.getDate() - today.getDate() > 14) {
      break;
    }

    const weekday = dateToWeekday(date);
    days[weekday]?.forEach(async ({ startHourString, endHourString }) => {
      await book("E3-107", date, startHourString, endHourString);
    });
  }
}

run(days);
