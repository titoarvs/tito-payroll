import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Payslip } from "~/api-services/pay-runs.types";
import {
  formatPayslipHours,
  formatPayslipMoney,
  formatPayslipPeriod,
  PAYSLIP_COMPANY,
} from "~/lib/payslip-letterhead";

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#171717",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#171717",
    paddingBottom: 10,
  },
  headerCol: {
    flex: 1,
  },
  headerCenter: {
    width: 110,
    alignItems: "center",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  company: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textTransform: "uppercase",
  },
  muted: {
    marginTop: 3,
    maxWidth: 210,
    lineHeight: 1.3,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    textTransform: "uppercase",
    textDecoration: "underline",
  },
  wordmark: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 6,
  },
  identity: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#171717",
    paddingVertical: 10,
  },
  identityCol: {
    flex: 1,
  },
  field: {
    flexDirection: "row",
    marginBottom: 2,
  },
  fieldLabel: {
    width: 92,
    fontFamily: "Helvetica-Bold",
  },
  fieldValue: {
    flex: 1,
  },
  table: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 1.5,
  },
  head: {
    borderBottomWidth: 1,
    borderBottomColor: "#a3a3a3",
    paddingBottom: 4,
    marginBottom: 2,
  },
  headText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
  },
  section: {
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
  },
  total: {
    backgroundColor: "#e5e5e5",
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    marginTop: 2,
  },
  colLabel: {
    flex: 2.2,
    paddingHorizontal: 4,
  },
  colNum: {
    flex: 1,
    paddingHorizontal: 4,
    textAlign: "right",
  },
  footer: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  net: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#dc2626",
  },
  netAmount: {
    textDecoration: "underline",
  },
  preparedLabel: {
    color: "#525252",
  },
  preparedName: {
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
});

const money = (value: string | null | undefined) => formatPayslipMoney(value);
const hours = (value: string | null | undefined) => formatPayslipHours(value);

const Field = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>
);

const Line = ({
  label,
  monthly = "",
  cutoff = "",
  hours: hourValue = "",
  section = false,
  total = false,
}: {
  label: string;
  monthly?: string;
  cutoff?: string;
  hours?: string;
  section?: boolean;
  total?: boolean;
}) => (
  <View style={[styles.row, total ? styles.total : {}]}>
    <Text style={[styles.colLabel, section ? styles.section : {}]}>{label}</Text>
    <Text style={styles.colNum}>{monthly}</Text>
    <Text style={styles.colNum}>{cutoff}</Text>
    <Text style={styles.colNum}>{hourValue}</Text>
  </View>
);

export const payslipPdfFileName = (payslip: Payslip): string => {
  const code = payslip.employeeCode?.trim() || payslip.employeeId;
  const period = payslip.periodEnd?.slice(0, 10) || "payslip";
  return `payslip-${code}-${period}.pdf`;
};

export const PayslipPdfDocument = ({ payslip }: { payslip: Payslip }) => {
  const periodLabel = formatPayslipPeriod(payslip.periodEnd);
  const contribution = (
    Number(payslip.sss || 0) +
    Number(payslip.hdmf || 0) +
    Number(payslip.philhealth || 0)
  ).toFixed(2);
  const leaveHours = `${payslip.paidLeaveDays ?? "0.00"}d${
    payslip.unpaidLeaveDays &&
    payslip.unpaidLeaveDays !== "0.00" &&
    payslip.unpaidLeaveDays !== "0"
      ? ` / ${payslip.unpaidLeaveDays}d LWOP`
      : ""
  }`;
  const employeeName = (payslip.employeeName || "—").toUpperCase();

  return (
    <Document
      title={`Payslip for ${payslip.employeeName || "employee"}`}
      author={PAYSLIP_COMPANY.name}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerCol}>
            <Text style={styles.company}>{PAYSLIP_COMPANY.name}</Text>
            <Text style={styles.muted}>{PAYSLIP_COMPANY.address}</Text>
            <Text style={styles.muted}>{PAYSLIP_COMPANY.vatLine}</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Payslip</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.wordmark}>titopayroll.</Text>
            <Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Payroll Period: </Text>
              {periodLabel}
            </Text>
          </View>
        </View>

        <View style={styles.identity}>
          <View style={styles.identityCol}>
            <Field label="Employee Name:" value={employeeName} />
            <Field label="Employee ID No.:" value={payslip.employeeCode || "—"} />
            <Field label="Position:" value={payslip.position || "—"} />
            <Field
              label="Status:"
              value={payslip.employmentStatus || "—"}
            />
          </View>
          <View style={styles.identityCol}>
            <Field label="SSS No:" value={payslip.sssNumber || "—"} />
            <Field label="HDMF No:" value={payslip.hdmfNumber || "—"} />
            <Field label="Philhealth No:" value={payslip.philhealthNumber || "—"} />
            <Field label="TIN:" value={payslip.tinNumber || "—"} />
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.head]}>
            <Text style={[styles.colLabel, styles.headText]}> </Text>
            <Text style={[styles.colNum, styles.headText]}>Monthly</Text>
            <Text style={[styles.colNum, styles.headText]}>Per Cutoff</Text>
            <Text style={[styles.colNum, styles.headText]}>Hours</Text>
          </View>

          <Line label="Salary and Wages" section />
          <Line
            label="Basic"
            monthly={money(payslip.monthlyRate ?? "0")}
            cutoff={money(payslip.basicPay)}
            hours={hours(payslip.hoursWorked)}
          />
          <Line
            label="Allowance"
            monthly={money(payslip.allowance)}
            cutoff={money(payslip.allowance)}
          />
          <Line label="Total Gross Pay" cutoff={money(payslip.grossPay)} total />

          <Line label="Deductions" section />
          <Line label="SSS" monthly={money(payslip.sss)} />
          <Line label="HDMF" monthly={money(payslip.hdmf)} />
          <Line label="Philhealth" monthly={money(payslip.philhealth)} />
          <Line label="Contribution" monthly={money(contribution)} />
          <Line label="Tax Withheld" monthly={money(payslip.withholdingTax)} />
          <Line
            label="Total Deductions"
            cutoff={money(payslip.totalDeductions)}
            total
          />

          <Line label="Adjustments" section hours="No of Hrs." />
          <Line
            label="Holiday pay"
            monthly={money(payslip.holidayPay)}
            hours={hours(payslip.holidayHours)}
          />
          <Line
            label="Overtime"
            monthly={money(payslip.overtimePay)}
            hours={hours(payslip.overtimeHours)}
          />
          <Line
            label="Night difference"
            monthly={money(payslip.nightDiffPay)}
            hours={hours(payslip.nightDiffHours)}
          />
          <Line label="Leave (in Basic)" monthly={money(payslip.leavePay)} hours={leaveHours} />
          <Line label="Adjustments" monthly={money(payslip.otherAdjustment)} />
          <Line label="13th month pay" monthly={money(payslip.thirteenthMonthPay)} />
          <Line
            label="Total Adjustments"
            cutoff={money(payslip.totalAdjustments)}
            total
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.net}>
            NET PAY: <Text style={styles.netAmount}>{money(payslip.netPay)}</Text>
          </Text>
          <View>
            <Text style={styles.preparedLabel}>Prepared by:</Text>
            <Text style={styles.preparedName}>
              {payslip.preparedByName || "—"}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
