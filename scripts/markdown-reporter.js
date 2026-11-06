const fs = require('fs');
const path = require('path');

function formatLineRanges(lines) {
  if (!lines || lines.length === 0) return '-';
  const sorted = Array.from(new Set(lines)).sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  if (ranges.length > 8) {
    return ranges.slice(0, 8).join(', ') + '...';
  }
  return ranges.join(', ');
}

function getStatusBadge(pct) {
  if (pct >= 80) return '🟢 Pass';
  if (pct >= 50) return '🟡 Moderate';
  return '🔴 Low';
}

function formatPct(pct) {
  if (pct === undefined || pct === null || isNaN(pct)) return '100.00%';
  return `${Number(pct).toFixed(2)}%`;
}

class MarkdownReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options || {};
    this._reportPath = this._options.outputFile
      ? path.resolve(process.cwd(), this._options.outputFile)
      : path.resolve(process.cwd(), 'apps/mobile/__tests__/report/TEST_REPORT.md');
  }

  onRunComplete(testContexts, aggregatedResults) {
    try {
      const markdown = this.generateMarkdown(aggregatedResults);
      const dir = path.dirname(this._reportPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this._reportPath, markdown, 'utf8');
      console.log(`\n📄 [MarkdownReporter] Test & Coverage report updated: ${path.relative(process.cwd(), this._reportPath)}\n`);
    } catch (err) {
      console.error('Failed to generate markdown test report:', err);
    }
  }

  generateMarkdown(results) {
    const startTime = results.startTime || Date.now();
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalSuites = results.numTotalTestSuites || 0;
    const passedSuites = results.numPassedTestSuites || 0;
    const failedSuites = results.numFailedTestSuites || 0;
    const pendingSuites = results.numPendingTestSuites || 0;
    const totalTests = results.numTotalTests || 0;
    const passedTests = results.numPassedTests || 0;
    const failedTests = results.numFailedTests || 0;
    const pendingTests = results.numPendingTests || 0;
    const isSuccess = failedTests === 0 && failedSuites === 0;

    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) + '%' : '100%';
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

    let md = `# Automated Test & Coverage Report\n\n`;
    md += `> **Generated:** ${timestamp}  \n`;
    md += `> **Overall Status:** ${isSuccess ? '✅ PASSED' : '❌ FAILED'}  \n`;
    md += `> **Execution Duration:** ${durationSec}s  \n`;
    md += `> **Target Package:** \`apps/mobile\`  \n\n`;
    md += `---\n\n`;

    // 1. Test Execution Summary
    md += `## 1. Test Execution Summary\n\n`;
    md += `| Category | Total | Passed | Failed | Skipped | Pass Rate |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    md += `| **Test Suites** | ${totalSuites} | ${passedSuites} | ${failedSuites} | ${pendingSuites} | ${totalSuites > 0 ? ((passedSuites / totalSuites) * 100).toFixed(1) + '%' : '100%'} |\n`;
    md += `| **Tests** | ${totalTests} | ${passedTests} | ${failedTests} | ${pendingTests} | ${passRate} |\n\n`;

    // 2. Code Coverage Overview
    let coverageSummary = null;
    let fileCoverageList = [];

    if (results.coverageMap && typeof results.coverageMap.getCoverageSummary === 'function') {
      coverageSummary = results.coverageMap.getCoverageSummary();
      const files = results.coverageMap.files();
      fileCoverageList = files.map((file) => {
        const fileCov = results.coverageMap.fileCoverageFor(file);
        const summary = fileCov.toSummary();
        const uncoveredLines = typeof fileCov.getUncoveredLines === 'function' ? fileCov.getUncoveredLines() : [];
        const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
        return {
          file: relPath,
          statements: summary.statements,
          branches: summary.branches,
          functions: summary.functions,
          lines: summary.lines,
          uncoveredLines,
        };
      });
    } else {
      // Fallback: check if coverage/coverage-summary.json exists on disk
      const jsonSummaryPath = path.resolve(process.cwd(), 'coverage/coverage-summary.json');
      if (fs.existsSync(jsonSummaryPath)) {
        try {
          const jsonCov = JSON.parse(fs.readFileSync(jsonSummaryPath, 'utf8'));
          if (jsonCov.total) {
            coverageSummary = jsonCov.total;
            fileCoverageList = Object.keys(jsonCov)
              .filter((k) => k !== 'total')
              .map((file) => {
                const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
                return {
                  file: relPath,
                  statements: jsonCov[file].statements,
                  branches: jsonCov[file].branches,
                  functions: jsonCov[file].functions,
                  lines: jsonCov[file].lines,
                  uncoveredLines: [],
                };
              });
          }
        } catch {}
      }
    }

    if (coverageSummary) {
      md += `## 2. Code Coverage Overview\n\n`;
      md += `| Metric | Covered / Total | Percentage | Target Benchmark | Status |\n`;
      md += `| :--- | :---: | :---: | :---: | :---: |\n`;
      md += `| **Branches** | ${coverageSummary.branches.covered} / ${coverageSummary.branches.total} | **${formatPct(coverageSummary.branches.pct)}** | 80.00% | ${getStatusBadge(coverageSummary.branches.pct)} |\n`;
      md += `| **Functions** | ${coverageSummary.functions.covered} / ${coverageSummary.functions.total} | **${formatPct(coverageSummary.functions.pct)}** | 80.00% | ${getStatusBadge(coverageSummary.functions.pct)} |\n`;
      md += `| **Lines** | ${coverageSummary.lines.covered} / ${coverageSummary.lines.total} | **${formatPct(coverageSummary.lines.pct)}** | 80.00% | ${getStatusBadge(coverageSummary.lines.pct)} |\n`;
      md += `| **Statements** | ${coverageSummary.statements.covered} / ${coverageSummary.statements.total} | **${formatPct(coverageSummary.statements.pct)}** | 80.00% | ${getStatusBadge(coverageSummary.statements.pct)} |\n\n`;

      if (fileCoverageList.length > 0) {
        // Sort files by line coverage ascending (lowest coverage first)
        fileCoverageList.sort((a, b) => (a.lines.pct || 0) - (b.lines.pct || 0));

        md += `### File-by-File Coverage\n\n`;
        md += `| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |\n`;
        md += `| :--- | :---: | :---: | :---: | :---: | :--- |\n`;
        fileCoverageList.forEach((item) => {
          md += `| \`${item.file}\` | ${formatPct(item.statements.pct)} | ${formatPct(item.branches.pct)} | ${formatPct(item.functions.pct)} | ${formatPct(item.lines.pct)} | ${formatLineRanges(item.uncoveredLines)} |\n`;
        });
        md += `\n`;
      }
    } else {
      md += `## 2. Code Coverage Overview\n\n`;
      md += `> ℹ️ *Code coverage was not captured for this test run. Run tests with \`--coverage\` to include branch, function, line, and statement metrics.*\n\n`;
    }

    // 3. Failed Tests Details (if any)
    if (failedTests > 0 && results.testResults) {
      md += `## 3. Failed Tests Details\n\n`;
      md += `| Test Suite | Test Case | Error Message |\n`;
      md += `| :--- | :--- | :--- |\n`;
      results.testResults.forEach((suite) => {
        if (suite.numFailingTests > 0 && Array.isArray(suite.testResults)) {
          const relSuite = path.relative(process.cwd(), suite.testFilePath).replace(/\\/g, '/');
          suite.testResults.forEach((test) => {
            if (test.status === 'failed') {
              const rawMsg = (test.failureMessages && test.failureMessages[0])
                ? test.failureMessages[0].split('\n')[0].replace(/\|/g, '\\|')
                : 'Assertion failed';
              md += `| \`${relSuite}\` | ${test.title} | \`${rawMsg.slice(0, 120)}\` |\n`;
            }
          });
        }
      });
      md += `\n`;
    }

    // 4. Test Suites Breakdown
    if (results.testResults && results.testResults.length > 0) {
      md += `## 4. Test Suites Breakdown\n\n`;
      md += `| Test Suite | Tests | Duration | Status |\n`;
      md += `| :--- | :---: | :---: | :---: |\n`;
      results.testResults.forEach((suite) => {
        const relSuite = path.relative(process.cwd(), suite.testFilePath).replace(/\\/g, '/');
        const passed = suite.numPassingTests || 0;
        const total = passed + (suite.numFailingTests || 0) + (suite.numPendingTests || 0);
        const duration = suite.perfStats && suite.perfStats.runtime
          ? (suite.perfStats.runtime / 1000).toFixed(2) + 's'
          : '-';
        const status = suite.numFailingTests > 0 ? '❌ Fail' : '✅ Pass';
        md += `| \`${relSuite}\` | ${passed} / ${total} | ${duration} | ${status} |\n`;
      });
      md += `\n`;
    }

    return md;
  }
}

// Support direct CLI execution: `node scripts/markdown-reporter.js`
if (require.main === module) {
  const reporter = new MarkdownReporter();
  const jsonSummaryPath = path.resolve(process.cwd(), 'coverage/coverage-summary.json');
  let covSummary = null;
  if (fs.existsSync(jsonSummaryPath)) {
    try {
      covSummary = JSON.parse(fs.readFileSync(jsonSummaryPath, 'utf8'));
    } catch {}
  }

  const dummyResults = {
    startTime: Date.now(),
    numTotalTestSuites: 0,
    numPassedTestSuites: 0,
    numFailedTestSuites: 0,
    numPendingTestSuites: 0,
    numTotalTests: 0,
    numPassedTests: 0,
    numFailedTests: 0,
    numPendingTests: 0,
    testResults: [],
  };

  const md = reporter.generateMarkdown(dummyResults);
  const outPath = reporter._reportPath;
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`[MarkdownReporter] Wrote report to: ${outPath}`);
}

module.exports = MarkdownReporter;
