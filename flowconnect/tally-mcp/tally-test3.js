// tally-test3.js — run with: node tally-test3.js
const TALLY_URL = 'http://localhost:9000';
const TIMEOUT_MS = 5000;

async function tallyRequest(xml) {
  const res = await fetch(TALLY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: xml,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return res.text();
}

const tests = [
  // 1. List of Accounts (this one worked before)
  ['List of Accounts', `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>List of Accounts</REPORTNAME>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>ABC Traders</SVCURRENTCOMPANY>
      </STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`],

  // 2. Day Book
  ['Day Book', `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>Day Book</REPORTNAME>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>ABC Traders</SVCURRENTCOMPANY>
        <SVFROMDATE>20250401</SVFROMDATE>
        <SVTODATE>20260331</SVTODATE>
      </STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`],

  // 3. Balance Sheet
  ['Balance Sheet', `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>Balance Sheet</REPORTNAME>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>ABC Traders</SVCURRENTCOMPANY>
      </STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`],

  // 4. Profit and Loss
  ['Profit and Loss', `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>Profit and Loss</REPORTNAME>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>ABC Traders</SVCURRENTCOMPANY>
      </STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`],

  // 5. Trial Balance
  ['Trial Balance', `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>Trial Balance</REPORTNAME>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>ABC Traders</SVCURRENTCOMPANY>
      </STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`],

  // 6. Stock Summary
  ['Stock Summary', `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>Stock Summary</REPORTNAME>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>ABC Traders</SVCURRENTCOMPANY>
      </STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`],

  // 7. Ledger collection via TDL
  ['Ledger TDL Collection', `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA>
      <REQUESTDESC>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>ABC Traders</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE>
          <COLLECTION ISODBC="No">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME,PARENT,CLOSINGBALANCE</FETCH>
          </COLLECTION>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </EXPORTDATA></BODY>
  </ENVELOPE>`],
];

(async () => {
  for (const [name, xml] of tests) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`TEST: ${name}`);
    console.log('='.repeat(50));
    try {
      const result = await tallyRequest(xml);
      const preview = result.substring(0, 500);
      const status = result.includes('LINEERROR') ? '❌ ERROR' : '✅ OK';
      console.log(status);
      console.log(preview);
    } catch (e) {
      if (e.name === 'TimeoutError') {
        console.log('⏱ TIMEOUT — Tally did not respond in 5s (report may not exist in EDU)');
      } else {
        console.error('❌ FAIL:', e.message);
      }
    }
  }
  console.log('\nDone!');
})();