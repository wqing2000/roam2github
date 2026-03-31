var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/sanitizeFileName.js
var require_sanitizeFileName = __commonJS({
  "src/utils/sanitizeFileName.js"(exports2, module2) {
    var sanitize = require("sanitize-filename");
    module2.exports = function sanitizeFileName2(fileName, md_replacement2) {
      fileName = fileName.replace(/\//g, "\uFF0F");
      const sanitized = sanitize(fileName, { replacement: md_replacement2 });
      if (sanitized != fileName) {
        return sanitized;
      } else return fileName;
    };
  }
});

// src/utils/console.js
var require_console = __commonJS({
  "src/utils/console.js"(exports2, module2) {
    function log2(...messages) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").replace("Z", "");
      console.log(timestamp, "R2G", ...messages);
    }
    async function error2(err) {
      log2("ERROR -", err);
      console.timeEnd("R2G Exit after");
      process.exit(1);
    }
    module2.exports = {
      log: log2,
      error: error2
    };
  }
});

// src/utils/getRepoPath.js
var require_getRepoPath = __commonJS({
  "src/utils/getRepoPath.js"(exports2, module2) {
    var path2 = require("path");
    var fs2 = require("fs-extra");
    var { log: log2 } = require_console();
    module2.exports = function getRepoPath2() {
      const ubuntuPath = path2.join("/", "home", "runner", "work");
      const exists = fs2.pathExistsSync(ubuntuPath);
      if (exists) {
        const files = fs2.readdirSync(ubuntuPath).filter((f) => !f.startsWith("_"));
        if (files.length === 1) {
          const repo_name = files[0];
          const files2 = fs2.readdirSync(path2.join(ubuntuPath, repo_name));
          const withoutR2G = files2.filter((f) => f != "roam2github");
          if (files2.length === 1 && files2[0] == repo_name) {
            log2("Detected GitHub Actions path");
            return path2.join(ubuntuPath, repo_name, repo_name);
          }
          if (files2.length == 2 && withoutR2G.length == 1 && withoutR2G[0] == repo_name) {
            log2('Detected GitHub Actions path found. (Old main.yml being used, with potential "roam2github" repo name conflict)');
            return path2.join(ubuntuPath, repo_name, repo_name);
          } else {
            log2("GitHub Actions path not found. Using local path");
            return false;
          }
        } else {
          log2("GitHub Actions path not found. Using local path");
          return false;
        }
      } else {
        log2("GitHub Actions path not found. Using local path");
        return false;
      }
    };
  }
});

// src/utils/roam.js
var require_roam = __commonJS({
  "src/utils/roam.js"(exports2, module2) {
    var { log: log2 } = require_console();
    async function roam_login2(browserPage, config) {
      const { ROAM_EMAIL: ROAM_EMAIL2, ROAM_PASSWORD: ROAM_PASSWORD2 } = config;
      return new Promise(async (resolve, reject) => {
        try {
          log2("- Navigating to login page");
          await browserPage.goto("https://roamresearch.com/#/signin");
          log2("- Checking for email field");
          await browserPage.waitForSelector('input[name="email"]');
          log2("- (Wait for auto-refresh)");
          try {
            await browserPage.waitForSelector(".loading-astrolabe", { timeout: 2e4 });
            await browserPage.waitForSelector(".loading-astrolabe", { hidden: true });
          } catch (err) {
            log2("- no astrolabe spinner, maybe graph is small or already cached?");
          }
          log2("- Filling email field");
          await browserPage.type('input[name="email"]', ROAM_EMAIL2);
          log2("- Filling password field");
          await browserPage.type('input[name="password"]', ROAM_PASSWORD2);
          log2('- Checking for "Sign In" button');
          await browserPage.waitForFunction(() => [...document.querySelectorAll("button.bp3-button")].find((button) => button.innerText == "Sign In"));
          log2('- Clicking "Sign In"');
          await browserPage.evaluate(() => {
            [...document.querySelectorAll("button.bp3-button")].find((button) => button.innerText == "Sign In").click();
          });
          const login_error_selector = 'div[style="font-size: 12px; color: red;"]';
          const graphs_selector = ".my-graphs";
          await browserPage.waitForSelector(login_error_selector + ", " + graphs_selector);
          const error_el = await browserPage.$(login_error_selector);
          if (error_el) {
            const error_message = await browserPage.evaluate((el) => el.innerText, error_el);
            reject(`Login error. Roam says: "${error_message}"`);
          } else if (await browserPage.$(graphs_selector)) {
            log2("Login successful!");
            resolve();
          } else {
            reject("Login error: unknown");
          }
        } catch (err) {
          reject(err);
        }
      });
    }
    async function roam_open_graph2(browserPage, graph_name) {
      return new Promise(async (resolve, reject) => {
        try {
          browserPage.on("dialog", async (dialog) => await dialog.accept());
          log2("- Navigating to graph");
          await browserPage.goto(`https://roamresearch.com/#/app/${graph_name}?disablecss=true&disablejs=true`);
          try {
            await browserPage.waitForSelector(".loading-astrolabe");
            log2("- astrolabe spinning...");
          } catch (err) {
            log2("- no astrolabe spinner, maybe graph is small or already cached?");
          }
          await browserPage.waitForSelector(".roam-app");
          log2("Graph loaded!");
          resolve(browserPage);
        } catch (err) {
          reject(err);
        }
      });
    }
    module2.exports = {
      roam_login: roam_login2,
      roam_open_graph: roam_open_graph2
    };
  }
});

// src/main.js
var main_exports = {};
__export(main_exports, {
  newPage: () => newPage
});
module.exports = __toCommonJS(main_exports);
var path = require("path");
var fs = require("fs-extra");
var puppeteer = require("puppeteer");
var extract = require("extract-zip");
var edn_format = require("edn-formatter").edn_formatter.core.format;
var sanitizeFileName = require_sanitizeFileName();
var { log, error } = require_console();
var getRepoPath = require_getRepoPath();
var { roam_login, roam_open_graph } = require_roam();
console.time("R2G Exit after");
if (fs.existsSync(path.join(__dirname, ".env"))) {
  require("dotenv").config();
}
var { ROAM_EMAIL, ROAM_PASSWORD, ROAM_GRAPH, BACKUP_JSON, BACKUP_EDN, BACKUP_MARKDOWN, MD_REPLACEMENT, MD_SKIP_BLANKS, TIMEOUT } = process.env;
if (!ROAM_EMAIL) error("Secrets error: ROAM_EMAIL not found");
if (!ROAM_PASSWORD) error("Secrets error: ROAM_PASSWORD not found");
if (!ROAM_GRAPH) error("Secrets error: ROAM_GRAPH not found");
var graph_names = ROAM_GRAPH.split(/,|\n/).map((g) => g.trim()).filter((g) => g != "");
var backup_types = [
  { type: "JSON", backup: BACKUP_JSON },
  { type: "EDN", backup: BACKUP_EDN },
  { type: "Markdown", backup: BACKUP_MARKDOWN }
].map((f) => {
  f.backup === void 0 || f.backup.toLowerCase() === "true" ? f.backup = true : f.backup = false;
  return f;
});
log("backup_types:", backup_types);
var md_replacement = MD_REPLACEMENT || "\uFFFD";
var md_skip_blanks = (MD_SKIP_BLANKS && MD_SKIP_BLANKS.toLowerCase()) === "false" ? false : true;
var timeout = TIMEOUT || 6e5;
var tmp_dir = path.join(__dirname, "tmp");
var repo_path = getRepoPath();
var backup_dir = repo_path ? repo_path : path.join(__dirname, "backup");
init();
async function init() {
  try {
    await fs.remove(tmp_dir, { recursive: true });
    log("Create browser");
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH,
      // args: ["--no-sandbox", "--disable-setuid-sandbox"],
      args: ["--no-sandbox"]
      // headless: false, // to test locally and see what's going on
    });
    log("Login");
    const browserPage = await newPage(browser);
    await roam_login(browserPage, { ROAM_EMAIL, ROAM_PASSWORD });
    for (const graph_name of graph_names) {
      const page = await newPage(browser);
      log("Open graph", graph_name);
      await roam_open_graph(page, graph_name);
      for (const f of backup_types) {
        if (f.backup) {
          const download_dir = path.join(tmp_dir, graph_name, f.type.toLowerCase());
          await page._client().send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: download_dir });
          log("Export", f.type);
          await roam_export(page, f.type, download_dir);
          log("Extract");
          await extract_file(f.type, download_dir, graph_name);
          await format_and_save(f.type, download_dir, graph_name);
        }
      }
    }
    log("Close browser");
    browser.close();
    log("DONE!");
  } catch (err) {
    error(err);
  }
  console.timeEnd("R2G Exit after");
}
async function newPage(browser) {
  const page = await browser.newPage();
  page.setDefaultTimeout(timeout);
  return page;
}
async function roam_export(page, filetype, download_dir) {
  return new Promise(async (resolve, reject) => {
    try {
      await fs.ensureDir(download_dir);
      await page.waitForSelector(".bp3-icon-more");
      log('- (check for "Sync Quick Capture Notes")');
      await new Promise((r) => setTimeout(r, 1e3));
      if (await page.$(".rm-quick-capture-sync-modal")) {
        log('- Detected "Sync Quick Capture Notes" modal. Closing');
        await page.keyboard.press("Escape");
        await page.waitForSelector(".rm-quick-capture-sync-modal", { hidden: true });
        log('- "Sync Quick Capture Notes" modal closed');
      }
      if (await page.$(".rm-modal-dialog--expired-plan")) {
        log('- Detected "Your subscription to Roam has expired." modal. Closing');
        await page.keyboard.press("Escape");
        await page.waitForSelector(".rm-modal-dialog--expired-plan", { hidden: true });
        log("- Expired subscription modal closed");
      }
      log('- Clicking "..." button');
      await page.click(".bp3-icon-more");
      log('- Checking for "Export All" option');
      await page.waitForFunction(() => [...document.querySelectorAll("li .bp3-fill")].find((li) => li.innerText.match("Export All")));
      log('- Clicking "Export All" option');
      await page.evaluate(() => {
        [...document.querySelectorAll("li .bp3-fill")].find((li) => li.innerText.match("Export All")).click();
      });
      const chosen_format_selector = ".bp3-dialog .bp3-button-text";
      log("- Checking for export dialog");
      await page.waitForSelector(chosen_format_selector);
      const chosen_format = (await page.$eval(chosen_format_selector, (el) => el.innerText)).trim();
      log(`- format chosen is "${chosen_format}"`);
      if (filetype != chosen_format) {
        log("- Clicking export format");
        await page.click(chosen_format_selector);
        log("- Checking for dropdown options");
        await page.waitForSelector(".bp3-text-overflow-ellipsis");
        log("- Checking for dropdown option", filetype);
        await page.waitForFunction((filetype2) => [...document.querySelectorAll(".bp3-text-overflow-ellipsis")].find((dropdown) => dropdown.innerText.match(filetype2)), filetype);
        log("- Clicking", filetype);
        await page.evaluate((filetype2) => {
          [...document.querySelectorAll(".bp3-text-overflow-ellipsis")].find((dropdown) => dropdown.innerText.match(filetype2)).click();
        }, filetype);
      } else {
        log("-", filetype, "already selected");
      }
      log('- Checking for "Export All" button');
      await page.waitForFunction(() => [...document.querySelectorAll("button.bp3-button.bp3-intent-primary")].find((button) => button.innerText.match("Export All|Export")));
      log('- Clicking "Export All" button');
      await page.evaluate(() => {
        [...document.querySelectorAll("button.bp3-button.bp3-intent-primary")].find((button) => button.innerText.match("Export All|Export")).click();
      });
      log("- Waiting for download to start");
      await new Promise((r) => setTimeout(r, 1e4));
      log("- Downloading");
      await waitForDownload(download_dir);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}
function waitForDownload(download_dir) {
  return new Promise(async (resolve, reject) => {
    try {
      checkDownloads();
      async function checkDownloads() {
        const files = await fs.readdir(download_dir);
        const file = files[0];
        if (file && (file.match(/\.zip$/) || file.match(/\.json$/) || file.match(/\.edn$/))) {
          log(file, "downloaded!");
          resolve();
        } else {
          checkDownloads();
        }
      }
    } catch (err) {
      reject(err);
    }
  });
}
async function extract_file(filetype, download_dir, graph_name) {
  return new Promise(async (resolve, reject) => {
    try {
      const files = await fs.readdir(download_dir);
      if (files.length === 0) reject("Extraction error: download_dir is empty");
      if (files.length > 1) reject("Extraction error: download_dir contains more than one file");
      const file = files[0];
      if (filetype !== "Markdown") {
        const regexp = new RegExp(`.${filetype.toLowerCase()}`);
        if (file.match(regexp)) {
          const extract_dir2 = path.join(download_dir, "_extraction");
          await fs.ensureDir(extract_dir2);
          const oldFilePath = path.join(download_dir, file);
          const newFileName = `${graph_name}.${filetype.toLowerCase()}`;
          const newFilePath = path.join(download_dir, newFileName);
          await fs.rename(oldFilePath, newFilePath);
          const targetFilePath = path.join(extract_dir2, newFileName);
          await fs.move(newFilePath, targetFilePath, { overwrite: true });
          resolve();
        } else {
          reject(`'Extraction error: ${filetype} file not found'`);
        }
      }
      if (!file.match(/\.zip$/)) reject("Extraction error: .zip not found");
      const file_fullpath = path.join(download_dir, file);
      const extract_dir = path.join(download_dir, "_extraction");
      log("- Extracting " + file);
      await extract(file_fullpath, {
        dir: extract_dir,
        onEntry(entry, zipfile) {
          if (entry.fileName.endsWith("/")) {
            return false;
          }
          if (md_skip_blanks && entry.uncompressedSize <= 3) {
            return false;
          }
          entry.fileName = sanitizeFileName(entry.fileName, md_replacement);
          if (fs.pathExistsSync(path.join(extract_dir, entry.fileName))) {
          }
          return true;
        }
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}
async function format_and_save(filetype, download_dir, graph_name) {
  return new Promise(async (resolve, reject) => {
    try {
      const extract_dir = path.join(download_dir, "_extraction");
      const files = await fs.readdir(extract_dir);
      if (files.length === 0) reject("Extraction error: extract_dir is empty");
      if (filetype == "Markdown") {
        const markdown_dir = path.join(backup_dir, "markdown", graph_name);
        await fs.remove(markdown_dir, { recursive: true });
        log("- Saving Markdown");
        for (const file of files) {
          const file_fullpath = path.join(extract_dir, file);
          const new_file_fullpath = path.join(markdown_dir, file);
          await fs.move(file_fullpath, new_file_fullpath, { overwrite: true });
        }
      } else {
        const file = files[0];
        const file_fullpath = path.join(extract_dir, file);
        const fileext = file.split(".").pop();
        const new_file_fullpath = path.join(backup_dir, fileext, file);
        if (fileext == "json") {
          log("- Formatting JSON");
          const json = await fs.readJson(file_fullpath);
          const new_json = JSON.stringify(json, null, 2);
          log("- Saving formatted JSON");
          await fs.outputFile(new_file_fullpath, new_json);
        } else if (fileext == "edn") {
          log("- Formatting EDN (this can take a couple minutes for large graphs)");
          const edn = await fs.readFile(file_fullpath, "utf-8");
          const edn_prefix = "#datascript/DB ";
          var new_edn = edn_prefix + edn_format(edn.replace(new RegExp("^" + edn_prefix), ""));
          checkFormattedEDN(edn, new_edn);
          log("- Saving formatted EDN");
          await fs.outputFile(new_file_fullpath, new_edn);
        } else reject(`format_and_save error: Unhandled filetype: ${files}`);
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}
function checkFormattedEDN(original, formatted) {
  const reverse_format = formatted.trim().split("\n").map((line) => line.trim()).join(" ");
  if (original === reverse_format) {
    return true;
  } else {
    error("EDN formatting error: mismatch with original");
    return false;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  newPage
});
