const { log } = require('./console')

/**
 * 
 * @param {BrowserPage} browser 
 * @param {{
 * 	ROAM_EMAIL: string,
 * 	ROAM_PASSWORD: string,
 * }} config
 * @returns 
 */
async function roam_login(browserPage, config) {
	const { ROAM_EMAIL, ROAM_PASSWORD } = config
	return new Promise(async (resolve, reject) => {
		try {

			log('- Navigating to login page')
			await browserPage.goto('https://roamresearch.com/#/signin')

			log('- Checking for email field')
			await browserPage.waitForSelector('input[name="email"]')

			log('- (Wait for auto-refresh)')
			// log('- (Wait 10 seconds for auto-refresh)')
			// await page.waitForTimeout(10000) // because Roam auto refreshes the sign-in page, as mentioned here https://github.com/MatthieuBizien/roam-to-git/issues/87#issuecomment-763281895 (and can be seen in non-headless browser)

			try {
				await browserPage.waitForSelector('.loading-astrolabe', { timeout: 20000 });
				await browserPage.waitForSelector('.loading-astrolabe', { hidden: true });
			} catch (err) {
				log('- no astrolabe spinner, maybe graph is small or already cached?')
			}
			// log('- auto-refreshed')

			log('- Filling email field')
			await browserPage.type('input[name="email"]', ROAM_EMAIL)

			log('- Filling password field')
			await browserPage.type('input[name="password"]', ROAM_PASSWORD)

			log('- Checking for "Sign In" button')
			await browserPage.waitForFunction(() => [...document.querySelectorAll('button.bp3-button')].find(button => button.innerText == 'Sign In'))

			log('- Clicking "Sign In"')
			await browserPage.evaluate(() => { [...document.querySelectorAll('button.bp3-button')].find(button => button.innerText == 'Sign In').click() })

			const login_error_selector = 'div[style="font-size: 12px; color: red;"]' // error message on login page
			const graphs_selector = '.my-graphs' // successful login, on graphs selection page

			await browserPage.waitForSelector(login_error_selector + ', ' + graphs_selector)

			const error_el = await browserPage.$(login_error_selector)

			if (error_el) {

				const error_message = await browserPage.evaluate(el => el.innerText, error_el)
				reject(`Login error. Roam says: "${error_message}"`)

			} else if (await browserPage.$(graphs_selector)) {

				log('Login successful!')
				resolve()

			} else {
				reject('Login error: unknown')
			}

		} catch (err) { reject(err) }
	})
}

/**
 * 
 * @param {BrowserPage} browserPage 
 * @param {string} graph_name 
 * @returns 
 */
async function roam_open_graph(browserPage, graph_name) {
	return new Promise(async (resolve, reject) => {
		try {

			browserPage.on("dialog", async (dialog) => await dialog.accept()) // Handles "Changes will not be saved" dialog when trying to navigate away from official Roam help database https://roamresearch.com/#/app/help

			log('- Navigating to graph')
			await browserPage.goto(`https://roamresearch.com/#/app/${graph_name}?disablecss=true&disablejs=true`)

			// log('- Checking for astrolabe spinner')
			try {
				await browserPage.waitForSelector('.loading-astrolabe')
				log('- astrolabe spinning...')

				// await page.waitForSelector('.loading-astrolabe', { hidden: true })
				// log('- astrolabe spinning stopped')
			} catch (err) {
				log('- no astrolabe spinner, maybe graph is small or already cached?')
			}

			// try {
			await browserPage.waitForSelector('.roam-app') // add short timeout here, if fails, don't exit code 1, and instead CHECK if have permission to view graph
			// } catch (err) {
			//     await page.waitForSelector('.navbar') // Likely screen saying 'You do not have permission to view this database'
			//     reject()
			// }

			log('Graph loaded!')
			resolve(browserPage)

		} catch (err) { reject(err) }
	})
}

module.exports = {
	roam_login,
	roam_open_graph,
}