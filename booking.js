import puppeteer from "puppeteer";
import {config} from 'dotenv';
config()

async function run(){
	const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://tp.uio.no/ntnu/rombestilling/');
	await page.type('input[placeholder="Search or choose from the list"]', 'NTNU')
	const [button] = await page.$x('//*[contains(text(), "NTNU")]')
	await button.click()
	await Promise.all([
		page.waitForNavigation(),
		await page.click('button[type=submit]')
	]);
	await page.type('input[id=username]', process.env.FEIDE_USERNAME)
	await page.type('input[id=password]', process.env.FEIDE_PWD)
	await Promise.all([
		page.waitForNavigation(),
		await page.click('button[type=submit]')
	]);
	await page.screenshot({path: 'screenshot.png'});
}

run()