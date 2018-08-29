const fs = require('fs');
const path = require('path');
const chai = require("chai");
const should = chai.should();
const JWebDriver = require('jwebdriver');
chai.use(JWebDriver.chaiSupportChainPromise);
const resemble = require('resemblejs-node');
resemble.outputSettings({
  errorType: 'flatDifferenceIntensity'
});

const rootPath = getRootPath();

module.exports = function () {
  let driver, testVars;

  before(function () {
    let self = this;
    driver = self.driver;
    testVars = self.testVars;
  });


  const {
    URL,
    LOGIN_ID,
    LOGIN_PASS,
    DATE = new Date(),
    WORK_TIME_IN = "0900",
    WORK_TIME_OUT = "1900",
    BREAK_TIME_IN = "1300",
    BREAK_TIME_OUT = "1400",
  } = process.env;
  const selectorOfDateButton = ((date) => {
    const d = new Date(date);
    const attr = `[data-date="${('0' + (d.getMonth() + 1)).slice(0, 2)}/${d.getDate()}/${d.getFullYear()}"]`;
    return `#attendance-table-body > .work-row${attr} button${attr} > span`;
  })(DATE);
  console.log(URL);

  it(`url: ${URL}`, async function () {
    await driver.url(_(URL));
  });

  it('waitBody: ', async function () {
    await driver.sleep(500).wait('body', 30000).html().then(function (code) {
      isPageError(code).should.be.false;
    });
  });

  it('sendKeys: LOGIN_ID{ENTER}', async function () {
    await driver.sendKeys(`${LOGIN_ID}{ENTER}`);
  });

  it('waitBody: ', async function () {
    await driver.sleep(500).wait('body', 30000).html().then(function (code) {
      isPageError(code).should.be.false;
    });
  });

  it('sendKeys: {TAB}LOGIN_PASS{ENTER}', async function () {
    await driver.sendKeys(`{TAB}${LOGIN_PASS}{ENTER}`);
  });

  it('waitBody: ', async function () {
    await driver.sleep(500).wait('body', 30000).html().then(function (code) {
      isPageError(code).should.be.false;
    });
  });

  // サインインを維持しますか？が出た時用
  it('sendKeys: {ENTER}', async function () {
    await driver.sendKeys(`{ENTER}`);
  });

  // 指定された日付の"入力"ボタンをクリック
  it(`click: 入力 ( ${selectorOfDateButton}, 1, 8, 0 )`, async function () {
    await driver.sleep(300).wait(selectorOfDateButton, 30000)
      .sleep(300).mouseMove(1, 8).click(0);
  });

  // 勤務時間開始をクリック
  it('click: #work-time-in, 33, 16, 0', async function () {
    await driver.sleep(300).wait('#work-time-in', 30000)
      .sleep(300).mouseMove(33, 16).click(0);
  });

  it('sendKeys: 勤怠情報入力', async function () {
    await driver.sendKeys(`${WORK_TIME_IN}{TAB}${WORK_TIME_OUT}{TAB}${BREAK_TIME_IN}{TAB}${BREAK_TIME_OUT}`);
  });

  it('click: すべて承認依頼 ( //span[text()="すべて承認依頼"], 32, 0, 0 )', async function () {
    await driver.sleep(300).wait('//span[text()="すべて承認依頼"]', 30000)
      .sleep(300).mouseMove(32, 0).click(0);
  });

  // 確認用
  // it('waitBody: 1000000', async function () {
  //   await driver.sleep(1000000).wait('body', 30000).html().then(function (code) {
  //     isPageError(code).should.be.false;
  //   });
  // });

  function _(str) {
    if (typeof str === 'string') {
      return str.replace(/\{\{(.+?)\}\}/g, function (all, key) {
        return testVars[key] || '';
      });
    }
    else {
      return str;
    }
  }

};

if (module.parent && /mocha\.js/.test(module.parent.id)) {
  runThisSpec();
}

function runThisSpec() {
  // read config
  let webdriver = process.env['webdriver'] || '';
  let proxy = process.env['wdproxy'] || '';
  let config = require(rootPath + '/config.json');
  let webdriverConfig = Object.assign({}, config.webdriver);
  let host = webdriverConfig.host;
  let port = webdriverConfig.port || 4444;
  let match = webdriver.match(/([^\:]+)(?:\:(\d+))?/);
  if (match) {
    host = match[1] || host;
    port = match[2] || port;
  }
  let testVars = config.vars;
  let browsers = webdriverConfig.browsers;
  browsers = browsers.replace(/^\s+|\s+$/g, '');
  delete webdriverConfig.host;
  delete webdriverConfig.port;
  delete webdriverConfig.browsers;

  // read hosts
  let hostsPath = rootPath + '/hosts';
  let hosts = '';
  if (fs.existsSync(hostsPath)) {
    hosts = fs.readFileSync(hostsPath).toString();
  }
  let specName = path.relative(rootPath, __filename).replace(/\\/g, '/').replace(/\.js$/, '');

  browsers.split(/\s*,\s*/).forEach(function (browserName) {
    let caseName = specName + ' : ' + browserName;

    let browserInfo = browserName.split(' ');
    browserName = browserInfo[0];
    let browserVersion = browserInfo[1];

    describe(caseName, function () {

      this.timeout(600000);
      this.slow(1000);

      let driver;
      before(function () {
        let self = this;
        let driver = new JWebDriver({
          'host': host,
          'port': port
        });
        let sessionConfig = Object.assign({}, webdriverConfig, {
          'browserName': browserName,
          'version': browserVersion,
          'ie.ensureCleanSession': true,
          'chromeOptions': {
            'args': ['--enable-automation']
          }
        });
        if (proxy) {
          sessionConfig.proxy = {
            'proxyType': 'manual',
            'httpProxy': proxy,
            'sslProxy': proxy
          }
        }
        else if (hosts) {
          sessionConfig.hosts = hosts;
        }
        self.driver = driver.session(sessionConfig).maximize().config({
          pageloadTimeout: 30000, // page onload timeout
          scriptTimeout: 5000, // sync script timeout
          asyncScriptTimeout: 10000 // async script timeout
        });
        self.testVars = testVars;
        let casePath = path.dirname(caseName);
        self.screenshotPath = rootPath + '/screenshots/' + casePath;
        self.diffbasePath = rootPath + '/diffbase/' + casePath;
        self.caseName = caseName.replace(/.*\//g, '').replace(/\s*[:\.\:\-\s]\s*/g, '_');
        mkdirs(self.screenshotPath);
        mkdirs(self.diffbasePath);
        self.stepId = 0;
        return self.driver;
      });

      module.exports();

      beforeEach(function () {
        let self = this;
        self.stepId++;
        if (self.skipAll) {
          self.skip();
        }
      });

      afterEach(async function () {
        let self = this;
        let currentTest = self.currentTest;
        let title = currentTest.title;
        if (currentTest.state === 'failed' && /^(url|waitBody|switchWindow|switchFrame):/.test(title)) {
          self.skipAll = true;
        }
        if (!/^(closeWindow):/.test(title)) {
          let filepath = self.screenshotPath + '/' + self.caseName + '_' + self.stepId;
          let driver = self.driver;
          try {
            // catch error when get alert msg
            await driver.getScreenshot(filepath + '.png');
            let url = await driver.url();
            let html = await driver.source();
            html = '<!--url: ' + url + ' -->\n' + html;
            fs.writeFileSync(filepath + '.html', html);
            let cookies = await driver.cookies();
            fs.writeFileSync(filepath + '.cookie', JSON.stringify(cookies));
          }
          catch (e) {
          }
        }
      });

      after(function () {
        return this.driver.close();
      });

    });
  });
}

function getRootPath() {
  let rootPath = path.resolve(__dirname);
  while (rootPath) {
    if (fs.existsSync(rootPath + '/config.json')) {
      break;
    }
    rootPath = rootPath.substring(0, rootPath.lastIndexOf(path.sep));
  }
  return rootPath;
}

function mkdirs(dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirs(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
}

function callSpec(name) {
  try {
    require(rootPath + '/' + name)();
  }
  catch (e) {
    console.log(e)
    process.exit(1);
  }
}

function isPageError(code) {
  return code == '' || / jscontent="errorCode" jstcache="\d+"|diagnoseConnectionAndRefresh|dnserror_unavailable_header|id="reportCertificateErrorRetry"|400 Bad Request|403 Forbidden|404 Not Found|500 Internal Server Error|502 Bad Gateway|503 Service Temporarily Unavailable|504 Gateway Time-out/i.test(code);
}

function catchError(error) {

}
