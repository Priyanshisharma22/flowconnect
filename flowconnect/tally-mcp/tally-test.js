// tally-test2.js — run with: node tally-test2.js
const TALLY_URL = 'http://localhost:9000';

async function tallyRequest(xml) {
  const res = await fetch(TALLY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: xml,
  });
  return res.text();
}

// 1. Get company list via collection
async function getCompanies() {
  const xml = `<ENVELOPE>
    <HEADER>
      <TALLYREQUEST>Export Data</TALLYREQUEST>
    </HEADER>
    <BODY>
      <EXPORTDATA>
        <REQUESTDESC>
          <STATICVARIABLES>
            <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
          </STATICVARIABLES>
          <REPORTNAME>List of Companies</REPORTNAME>
        </REQUESTDESC>
      </EXPORTDATA>
    </BODY>
  </ENVELOPE>`;
  return tallyRequest(xml);
}

// 2. Get ledgers via TDL collection (correct TallyPrime way)
async function getLedgersTDL() {
  const xml = `<ENVELOPE>
    <HEADER>
      <TALLYREQUEST>Export Data</TALLYREQUEST>
    </HEADER>
    <BODY>
      <EXPORTDATA>
        <REQUESTDESC>
          <REPORTNAME>List of Accounts</REPORTNAME>
          <STATICVARIABLES>
            <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
            <SVCURRENTCOMPANY>ABC Traders</SVCURRENTCOMPANY>
          </STATICVARIABLES>
        </REQUESTDESC>
      </EXPORTDATA>
    </BODY>
  </ENVELOPE>`;
  return tallyRequest(xml);
}

// 3. Get ledgers via proper collection request
async function getLedgersCollection() {
  const xml = `<ENVELOPE>
    <HEADER>
      <TALLYREQUEST>Export Data</TALLYREQUEST>
    </HEADER>
    <BODY>
      <EXPORTDATA>
        <REQUESTDESC>
          <REPORTNAME>List of Ledgers</REPORTNAME>
          <STATICVARIABLES>
            <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
            <SVCURRENTCOMPANY>ABC Traders</SVCURRENTCOMPANY>
          </STATICVARIABLES>
        </REQUESTDESC>
      </EXPORTDATA>
    </BODY>
  </ENVELOPE>`;
  return tallyRequest(xml);
}

// 4. Collection XML — most reliable way in TallyPrime
async function getLedgersViaCollection() {
  const xml = `<ENVELOPE>
    <HEADER>
      <TALLYREQUEST>Export Data</TALLYREQUEST>
    </HEADER>
    <BODY>
      <EXPORTDATA>
        <REQUESTDESC>
          <STATICVARIABLES>
            <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
            <SVCURRENTCOMPANY>ABC Traders</SVCURRENTCOMPANY>
          </STATICVARIABLES>
        </REQUESTDESC>
        <REQUESTDATA>
          <TALLYMESSAGE>
            <COLLECTION ISODBC="No" PRESERVEORDER="No">
              <TYPE>Ledger</TYPE>
              <FETCH>NAME, PARENT, CLOSINGBALANCE, OPENINGBALANCE</FETCH>
            </COLLECTION>
          </TALLYMESSAGE>
        </REQUESTDATA>
      </EXPORTDATA>
    </BODY>
  </ENVELOPE>`;
  return tallyRequest(xml);
}

// 5. Vouchers collection
async function getVouchers() {
  const xml = `<ENVELOPE>
    <HEADER>
      <TALLYREQUEST>Export Data</TALLYREQUEST>
    </HEADER>
    <BODY>
      <EXPORTDATA>
        <REQUESTDESC>
          <STATICVARIABLES>
            <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
            <SVCURRENTCOMPANY>ABC Traders</SVCURRENTCOMPANY>
            <SVFROMDATE>20250401</SVFROMDATE>
            <SVTODATE>20260331</SVTODATE>
          </STATICVARIABLES>
        </REQUESTDESC>
        <REQUESTDATA>
          <TALLYMESSAGE>
            <COLLECTION ISODBC="No">
              <TYPE>Voucher</TYPE>
              <FETCH>DATE, VOUCHERTYPENAME, PARTYLEDGERNAME, AMOUNT</FETCH>
            </COLLECTION>
          </TALLYMESSAGE>
        </REQUESTDATA>
      </EXPORTDATA>
    </BODY>
  </ENVELOPE>`;
  return tallyRequest(xml);
}

// 6. Trial Balance
async function getTrialBalance() {
  const xml = `<ENVELOPE>
    <HEADER>
      <TALLYREQUEST>Export Data</TALLYREQUEST>
    </HEADER>
    <BODY>
      <EXPORTDATA>
        <REQUESTDESC>
          <REPORTNAME>Trial Balance</REPORTNAME>
          <STATICVARIABLES>
            <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
            <SVCURRENTCOMPANY>ABC Traders</SVCURRENTCOMPANY>
          </STATICVARIABLES>
        </REQUESTDESC>
      </EXPORTDATA>
    </BODY>
  </ENVELOPE>`;
  return tallyRequest(xml);
}

// Run all tests
(async () => {
  const tests = [
    ['Companies',             getCompanies],
    ['Ledgers (report name)', getLedgersTDL],
    ['Ledgers (collection)',  getLedgersViaCollection],
    ['Vouchers (collection)', getVouchers],
    ['Trial Balance',         getTrialBalance],
  ];

  for (const [name, fn] of tests) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`TEST: ${name}`);
    console.log('='.repeat(50));
    try {
      const result = await fn();
      console.log(result.substring(0, 600));
    } catch (e) {
      console.error('FAIL:', e.message);
    }
  }
})();