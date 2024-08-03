const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views'); 
app.use(express.json());

async function login(username, password) {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto("http://43.250.40.63/Login.aspx");

    await page.waitForSelector("#txtUserName");
    await page.type("#txtUserName", username);

    await page.click("#btnNext");
    await page.waitForSelector("#txtPassword");
    await page.type("#txtPassword", password);

    await page.click("#btnSubmit");
    await page.waitForSelector("#ctl00_cpStud_lnkStudentMain");
    await page.click("#ctl00_cpStud_lnkStudentMain");

    await page.waitForSelector("#ctl00_cpHeader_ucStud_lblStudentName");
    const name = await page.$eval(
      "#ctl00_cpHeader_ucStud_lblStudentName",
      (el) => el.textContent
    );

    await page.waitForSelector("#ctl00_cpStud_lblTotalPercentage");
    const data = await page.$eval(
      "#ctl00_cpStud_lblTotalPercentage",
      (el) => el.textContent
    );

    await browser.close();
    return { name, data };
  } catch (e) {
    if (browser) {
      await browser.close();
    }
    throw e;
  }
}

app.get("/scrape", async (req, res) => {
  const { username, password } = req.query;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  try {
    const { name, data } = await login(username, password);
    res.render("result", { name, total_percentage: data });
  } catch (e) {
    console.error("An error occurred:", e);
    res.status(500).json({ error: "Scraping failed. Please try again later." });
  }
});
app.use("/",(req,res)=>res.send("hello"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
