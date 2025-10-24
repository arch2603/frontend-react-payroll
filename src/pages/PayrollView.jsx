import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function PayrollView({ employeeId }) {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        let ignore = false;
        async function load() {
            try {
                setLoading(true);
                SetErr(null);
                const res = await api.get(`/payroll/${employeeId}`);
                if (!ignore) setData(res.data);
            } catch (e) {
                if (!ignore) SetErr(e);
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        if (employeeId != null) load();
        return () => { ignore = true; }
    }, [employeeId]);

    const downloadPayslip = async () => {
        try {

            const res = await api.get(`/payslips/${employeeId}/pdf`, {
                responseType: "blob",
            });

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `payslip_${employeeId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert("Failed to download payslip.");
        }
    };

    if (loading) return <div>Loading payroll...</div>;
    if (err) return <div style={{ color: "crimson" }}>Error: {String(err)}</div>;
    if (!data || !data.employee) return <div>No employee or payroll found.</div>;


    return (
        <div style={{ maxWidth: 600, margin: "24px auto", padding: 20, border: "1px solid #ddd", borderRadius: 8 }}>
            <h3>
                Payslip for {data.employee.first_name} {data.employee.last_name}
            </h3>
            <div><strong>Position:</strong> {data.employee.position}</div>
            <div><strong>Gross Pay:</strong> ${data.payroll?.gross_pay}</div>
            <div><strong>Taxes:</strong> ${data.payroll?.taxes}</div>
            <div><strong>Other Deductions:</strong> ${data.payroll?.other_deductions}</div>
            <div style={{ fontWeight: "bold" }}>Net Pay: ${data.payroll?.net_pay}</div>

            <h4 style={{ marginTop: 12 }}>Leave</h4>
            <div>Annual: {data.leave?.annual_leave} days</div>
            <div>Sick: {data.leave?.sick_leave} days</div>
            <div>Bereavement: {data.leave?.bereavement_leave} days</div>

            <div style={{ marginTop: 12 }}>
                <button onClick={() => window.print()}>Print</button>
                <button onClick={downloadPayslip} style={{ marginLeft: 8 }}>
                    Download PDF
                </button>
            </div>
        </div>
    );
}
