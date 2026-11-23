/**
 * STAT 210 REVISION PORTAL - Google Apps Script backend
 * Dr. Fred Monari
 *
 * Run setupSTAT210() ONCE. It creates/initializes the records spreadsheet.
 * Existing records are retained when setup is run again.
 */

const STAT210_TITLE = 'STAT 210: Statistical Software and Data Analysis Revision';
const STAT210_STUDENTS = 'Students';
const STAT210_RESULTS = 'Assessment Results';
const STAT210_PROPERTY = 'STAT210_SPREADSHEET_ID';
const STAT210_ACCESS_PROPERTY = 'STAT210_LECTURER_ACCESS_CODE';

// No lecturer access code is embedded in this source.
// Configure a private code in Script Properties using configureLecturerAccessCode().

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('STAT 210 Revision Portal | Dr. Fred Monari')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function setupSTAT210() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty(STAT210_PROPERTY);
  let ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('STAT 210 Revision Portal - Student Records');
    id = ss.getId();
    props.setProperty(STAT210_PROPERTY, id);
  }

  let students = ss.getSheetByName(STAT210_STUDENTS);
  if (!students) students = ss.insertSheet(STAT210_STUDENTS);
  if (students.getLastRow() === 0) {
    students.appendRow(['Timestamp','Student Name','Registration Number','Email','Course Code','Programme/Class']);
    students.setFrozenRows(1);
  }

  let results = ss.getSheetByName(STAT210_RESULTS);
  if (!results) results = ss.insertSheet(STAT210_RESULTS);
  if (results.getLastRow() === 0) {
    results.appendRow([
      'Timestamp','Student Name','Registration Number','Email','Course Code',
      'Week','Topic','Score','Total Questions','Percentage','Passed',
      'Attempt Number','Submitted Answers'
    ]);
    results.setFrozenRows(1);
  }

  students.autoResizeColumns(1, 6);
  results.autoResizeColumns(1, 13);
  Logger.log('STAT 210 spreadsheet: ' + ss.getUrl());
  return ss.getUrl();
}

function getSTAT210Spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(STAT210_PROPERTY);
  if (!id) throw new Error('Records spreadsheet not initialized. Run setupSTAT210() first.');
  return SpreadsheetApp.openById(id);
}

function validateSTAT210Student_(s) {
  if (!s || !String(s.name || '').trim() || !String(s.reg || '').trim() ||
      !String(s.email || '').trim() || !String(s.course || '').trim()) {
    throw new Error('Full name, registration number, email and course code are required.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s.email).trim())) {
    throw new Error('Please enter a valid email address.');
  }
}

function stat210SafeCell_(v) {
  const value = String(v == null ? '' : v).trim();
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function saveSTAT210Student(student) {
  validateSTAT210Student_(student);
  const sheet = getSTAT210Spreadsheet_().getSheetByName(STAT210_STUDENTS);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    sheet.appendRow([
      new Date(), stat210SafeCell_(student.name), stat210SafeCell_(student.reg),
      stat210SafeCell_(student.email), stat210SafeCell_(student.course),
      stat210SafeCell_(student.programme || '')
    ]);
  } finally {
    lock.releaseLock();
  }
  return {success:true};
}

function saveSTAT210Attempt(data) {
  if (!data || !data.student) throw new Error('Student details are missing.');
  validateSTAT210Student_(data.student);
  const score = Number(data.score), total = Number(data.total), pct = Number(data.percentage);
  if (!Number.isFinite(score) || !Number.isFinite(total) || !Number.isFinite(pct) ||
      total < 1 || score < 0 || score > total || pct < 0 || pct > 100) {
    throw new Error('Invalid assessment result.');
  }
  const sheet = getSTAT210Spreadsheet_().getSheetByName(STAT210_RESULTS);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const last = sheet.getLastRow();
    let attempt = 1;
    if (last > 1) {
      const rows = sheet.getRange(2,3,last-1,5).getValues();
      attempt = rows.filter(r => String(r[0]) === String(data.student.reg) &&
        String(r[4]) === String(data.topic)).length + 1;
    }
    sheet.appendRow([
      new Date(), stat210SafeCell_(data.student.name), stat210SafeCell_(data.student.reg),
      stat210SafeCell_(data.student.email), stat210SafeCell_(data.student.course),
      stat210SafeCell_(data.week), stat210SafeCell_(data.topic), score, total, pct,
      data.passed === true ? 'YES' : 'NO', attempt,
      JSON.stringify(Array.isArray(data.answers) ? data.answers : [])
    ]);
  } finally {
    lock.releaseLock();
  }
  return {success:true};
}

/** Configure lecturer access code without committing it to source control. */
function configureLecturerAccessCode() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Configure STAT 210 lecturer access',
    'Enter a private access code (at least 12 characters recommended):', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return 'Cancelled.';
  const code = String(response.getResponseText() || '').trim();
  if (code.length < 4) throw new Error('Access code must contain at least 4 characters.');
  PropertiesService.getScriptProperties().setProperty(STAT210_ACCESS_PROPERTY, code);
  return 'Lecturer access code saved in Script Properties.';
}

function verifyLecturerAccess(code) {
  const saved = PropertiesService.getScriptProperties().getProperty(STAT210_ACCESS_PROPERTY);
  if (!saved) throw new Error('Lecturer access code is not configured. Run configureLecturerAccessCode() from the Apps Script editor first.');
  if (String(code || '') !== saved) throw new Error('Incorrect lecturer access code.');
  return {success:true};
}

function changeLecturerAccessCode(currentCode, newCode) {
  verifyLecturerAccess(currentCode);
  const next = String(newCode || '').trim();
  if (next.length < 4) throw new Error('New access code must contain at least 4 characters.');
  PropertiesService.getScriptProperties().setProperty(STAT210_ACCESS_PROPERTY, next);
  return {success:true};
}

function getSTAT210Dashboard(code) {
  verifyLecturerAccess(code);
  const ss = getSTAT210Spreadsheet_();
  const shS = ss.getSheetByName(STAT210_STUDENTS);
  const shR = ss.getSheetByName(STAT210_RESULTS);
  const students = shS.getLastRow() > 1 ? shS.getRange(2,1,shS.getLastRow()-1,6).getValues() : [];
  const results = shR.getLastRow() > 1 ? shR.getRange(2,1,shR.getLastRow()-1,13).getValues() : [];

  const unique = {};
  students.forEach(r => {
    const reg = String(r[2] || '').trim();
    if (!reg) return;
    if (!unique[reg] || new Date(r[0]) > new Date(unique[reg].timestamp)) {
      unique[reg] = {name:r[1], reg:reg, email:r[3], course:r[4], programme:r[5], timestamp:r[0]};
    }
  });

  const attempts = results.map(r => ({
    timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
    name:String(r[1]), reg:String(r[2]), email:String(r[3]), course:String(r[4]),
    week:String(r[5]), topic:String(r[6]), score:Number(r[7]), total:Number(r[8]),
    percentage:Number(r[9]), passed:String(r[10]), attempt:Number(r[11])
  })).reverse();

  const studentList = Object.keys(unique).map(k => unique[k]).sort((a,b) => String(a.name).localeCompare(String(b.name)));
  const avg = attempts.length ? attempts.reduce((s,a)=>s+(isFinite(a.percentage)?a.percentage:0),0)/attempts.length : 0;
  const passed = attempts.filter(a=>a.passed === 'YES').length;
  const topicStats = {};
  attempts.forEach(a => {
    if (!topicStats[a.topic]) topicStats[a.topic] = {topic:a.topic, attempts:0, passed:0, totalScore:0};
    topicStats[a.topic].attempts++;
    if (a.passed === 'YES') topicStats[a.topic].passed++;
    topicStats[a.topic].totalScore += a.percentage || 0;
  });
  Object.keys(topicStats).forEach(k => {
    topicStats[k].average = topicStats[k].attempts ? topicStats[k].totalScore/topicStats[k].attempts : 0;
    delete topicStats[k].totalScore;
  });

  const perStudent = {};
  studentList.forEach(st => {
    perStudent[st.reg] = {name:st.name,reg:st.reg,email:st.email,attempts:0,totalPct:0,last:st.timestamp,topics:{}};
  });
  attempts.forEach(a => {
    if (!perStudent[a.reg]) perStudent[a.reg] = {name:a.name,reg:a.reg,email:a.email,attempts:0,totalPct:0,last:a.timestamp,topics:{}};
    const s = perStudent[a.reg];
    s.attempts++;
    s.totalPct += a.percentage || 0;
    if (a.passed === 'YES') s.topics[a.topic] = true;
    if (new Date(a.timestamp) > new Date(s.last)) s.last = a.timestamp;
  });
  const studentPerformance = Object.values(perStudent).map(s => ({
    name:s.name,reg:s.reg,email:s.email,attempts:s.attempts,
    average:s.attempts ? s.totalPct/s.attempts : 0,
    completedTopics:Object.keys(s.topics).length,last:s.last
  })).sort((a,b)=>b.average-a.average);

  return {
    success:true, spreadsheetUrl:ss.getUrl(), registeredCount:studentList.length,
    attemptCount:attempts.length, passedCount:passed, averagePercentage:avg,
    students:studentList, attempts:attempts, topicStats:Object.values(topicStats),
    studentPerformance:studentPerformance
  };
}