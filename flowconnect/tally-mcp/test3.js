const xml = `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="Test Customer" ACTION="Create">
            <NAME>Test Customer</NAME>
            <PARENT>Sundry Debtors</PARENT>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

fetch('http://localhost:9000', {
  method: 'POST',
  headers: { 'Content-Type': 'text/xml' },
  body: xml
}).then(r => r.text()).then(console.log);