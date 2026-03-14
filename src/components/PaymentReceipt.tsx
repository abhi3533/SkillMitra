import { useRef } from "react";
import { formatLongDateIST } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Download, Printer, CheckCircle2 } from "lucide-react";

interface ReceiptData {
  receiptNumber: string;
  date: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  trainerName: string;
  totalSessions: number;
  amountPaid: number;
  platformCommission: number;
  trainerPayout: number;
  paymentId?: string;
  enrollmentStatus: string;
}

const PaymentReceipt = ({ data }: { data: ReceiptData }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SkillMitra Receipt - ${data.receiptNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
          .receipt { max-width: 640px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 24px; }
          .logo-section h1 { font-size: 22px; font-weight: 800; color: #1A56DB; }
          .logo-section p { font-size: 11px; color: #6b7280; margin-top: 2px; }
          .receipt-meta { text-align: right; }
          .receipt-meta .receipt-title { font-size: 18px; font-weight: 700; color: #1a1a1a; }
          .receipt-meta p { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .status-badge { display: inline-block; background: #dcfce7; color: #16a34a; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 12px; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: 600; margin-bottom: 8px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .info-item label { font-size: 11px; color: #6b7280; display: block; }
          .info-item span { font-size: 13px; font-weight: 500; color: #1a1a1a; }
          .line-items { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .line-items th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .line-items th:last-child { text-align: right; }
          .line-items td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
          .line-items td:last-child { text-align: right; font-weight: 500; }
          .total-row td { border-bottom: none; border-top: 2px solid #e5e7eb; font-weight: 700; font-size: 15px; padding-top: 12px; }
          .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; }
          .footer p { font-size: 11px; color: #9ca3af; line-height: 1.6; }
          .footer a { color: #1A56DB; text-decoration: none; }
          @media print { body { padding: 20px; } .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const formattedDate = formatLongDateIST(data.date);

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-3 justify-end no-print">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Print
        </Button>
        <Button size="sm" onClick={handlePrint}>
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </Button>
      </div>

      {/* Receipt Content */}
      <div ref={receiptRef} className="bg-card border rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-border pb-5 mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-primary">SkillMitra</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">by Learnvate Solutions Pvt. Ltd.</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">RECEIPT</p>
            <p className="text-xs text-muted-foreground mt-1">#{data.receiptNumber}</p>
            <span className="inline-block mt-1.5 bg-success/10 text-success text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />
              {data.enrollmentStatus === "trial" ? "Trial" : "Paid"}
            </span>
          </div>
        </div>

        {/* Student & Course Info */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Bill To</p>
            <p className="text-sm font-medium text-foreground">{data.studentName}</p>
            <p className="text-xs text-muted-foreground">{data.studentEmail}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Receipt Details</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground font-medium">{formattedDate}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Trainer</span>
                <span className="text-foreground font-medium">{data.trainerName}</span>
              </div>
              {data.paymentId && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Payment ID</span>
                  <span className="text-foreground font-medium font-mono text-[11px]">{data.paymentId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[10px] uppercase tracking-wide text-muted-foreground font-semibold py-2">Description</th>
              <th className="text-center text-[10px] uppercase tracking-wide text-muted-foreground font-semibold py-2">Sessions</th>
              <th className="text-right text-[10px] uppercase tracking-wide text-muted-foreground font-semibold py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-3 text-sm text-foreground">{data.courseName}</td>
              <td className="py-3 text-sm text-center text-muted-foreground">{data.totalSessions}</td>
              <td className="py-3 text-sm text-right font-medium text-foreground">₹{data.amountPaid.toLocaleString("en-IN")}</td>
            </tr>
            <tr className="border-t-2 border-border">
              <td colSpan={2} className="py-3 text-sm font-bold text-foreground">Total Paid</td>
              <td className="py-3 text-base text-right font-bold text-foreground">₹{data.amountPaid.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-8 pt-5 border-t border-border text-center">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            This is a computer-generated receipt and does not require a signature.<br />
            Learnvate Solutions Private Limited • contact@skillmitra.online<br />
            <a href="https://skillmitra.online" className="text-primary hover:underline">skillmitra.online</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
