import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../lib/api";
import { payBill } from "../lib/pay";
import { useAuth } from "../lib/auth";
import { buildReceipt } from "../lib/receiptHtml";
import { downloadReceipt } from "../lib/receipt";
import ScreenHeader from "../components/ScreenHeader";

function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function MaintenanceScreen() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [payee, setPayee] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    let loadedBills = [];
    try {
      const { bills, totalDue } = await api.maintenance();
      loadedBills = bills;
      setBills(bills);
      setTotalDue(totalDue);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
    try {
      const { account } = await api.bankAccount();
      setPayee(account);
    } catch {
      // Payee info is optional; ignore if it fails.
    }
    return loadedBills;
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const [payingId, setPayingId] = useState(null);

  const pay = async (bill) => {
    setPayingId(bill.id);
    try {
      const result = await payBill(bill);
      if (result.cancelled) return;
      const fresh = await load();
      // Open the receipt for the just-paid bill so it can be downloaded now.
      const paid = fresh.find((b) => b.id === bill.id) || {
        ...bill,
        status: "paid",
        paidAt: new Date().toISOString(),
      };
      setReceipt(paid);
    } catch (e) {
      Alert.alert("Payment failed", e.message);
    } finally {
      setPayingId(null);
    }
  };

  const download = async () => {
    if (!receipt) return;
    setDownloading(true);
    try {
      const { html, filename } = buildReceipt({ bill: receipt, user, payee });
      await downloadReceipt(html, filename);
    } catch (e) {
      Alert.alert("Could not generate receipt", e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        icon="card"
        title="Maintenance"
        subtitle="Bills, payments & receipts"
        right={
          <View style={styles.headerStat}>
            <Text style={styles.headerStatLabel}>Outstanding</Text>
            <Text style={styles.headerStatValue}>₹{totalDue}</Text>
          </View>
        }
      />
      {payee && (
        <View style={styles.payee}>
          <Text style={styles.payeeText}>
            Payments go to{" "}
            <Text style={styles.payeeStrong}>{payee.accountHolderName}</Text>
            {payee.bankName ? ` · ${payee.bankName}` : ""}
            {payee.last4 ? ` · A/c ••${payee.last4}` : ""}
          </Text>
        </View>
      )}
      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.bill}>
            <View style={{ flex: 1 }}>
              <Text style={styles.period}>{item.period}</Text>
              {item.status === "paid" ? (
                <Text style={styles.due}>Paid {formatDateTime(item.paidAt)}</Text>
              ) : (
                <Text style={styles.due}>Due {item.dueDate}</Text>
              )}
            </View>
            <Text style={styles.amount}>₹{item.amount}</Text>
            {item.status === "paid" ? (
              <TouchableOpacity style={styles.paidTag} onPress={() => setReceipt(item)}>
                <Text style={styles.paidText}>PAID</Text>
                <Text style={styles.receiptLink}>Receipt ›</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.payBtn, payingId === item.id && { opacity: 0.6 }]}
                onPress={() => pay(item)}
                disabled={payingId === item.id}
              >
                <Text style={styles.payText}>
                  {payingId === item.id ? "..." : "Pay"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <Modal
        visible={!!receipt}
        transparent
        animationType="fade"
        onRequestClose={() => setReceipt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            <LinearGradient
              colors={["#0E85AC", "#0B6E8F", "#075064"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.receiptTop}
            >
              <View style={styles.receiptTopRow}>
                <View style={styles.receiptTopIcon}>
                  <Ionicons name="receipt" size={18} color="#fff" />
                </View>
                <Text style={styles.receiptTitle}>Payment Receipt</Text>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>PAID</Text>
                </View>
              </View>
              <Text style={styles.receiptAmount}>₹{receipt?.amount}</Text>
            </LinearGradient>

            <View style={styles.receiptBody}>
            <ReceiptRow label="Bill period" value={receipt?.period} />
            <ReceiptRow label="Flat" value={receipt?.flatNo} />
            <ReceiptRow label="Paid on" value={formatDateTime(receipt?.paidAt)} />
            <ReceiptRow
              label="Payment ID"
              value={receipt?.paymentRef || "-"}
            />
            <ReceiptRow
              label="Method"
              value={
                receipt?.paymentRef?.startsWith("pay_")
                  ? "Razorpay (UPI/Card)"
                  : "Test mode"
              }
            />

            <TouchableOpacity
              style={[styles.downloadBtn, downloading && { opacity: 0.6 }]}
              onPress={download}
              disabled={downloading}
            >
              <Text style={styles.downloadBtnText}>
                {downloading ? "Preparing..." : "Download / Print receipt"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setReceipt(null)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text style={styles.receiptValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F7" },
  headerStat: { alignItems: "flex-end" },
  headerStatLabel: { color: "#CDE9F2", fontSize: 11, fontWeight: "600" },
  headerStatValue: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2 },
  payee: { backgroundColor: "#EAF6FA", paddingHorizontal: 16, paddingVertical: 10 },
  payeeText: { color: "#0B6E8F", fontSize: 12, textAlign: "center" },
  payeeStrong: { fontWeight: "800" },
  bill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  period: { fontSize: 16, fontWeight: "700", color: "#1B2B33" },
  due: { color: "#6B7B85", marginTop: 2, fontSize: 12 },
  amount: { fontSize: 16, fontWeight: "700", color: "#1B2B33" },
  payBtn: { backgroundColor: "#0B6E8F", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  payText: { color: "#fff", fontWeight: "700" },
  paidTag: { backgroundColor: "#E3F5E8", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  paidText: { color: "#2E9E52", fontWeight: "700", fontSize: 12 },
  receiptLink: { color: "#2E9E52", fontSize: 10, marginTop: 2 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  receiptCard: { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden" },
  receiptTop: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18 },
  receiptTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  receiptTopIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  receiptTitle: { fontSize: 17, fontWeight: "800", color: "#fff", flex: 1 },
  paidBadge: { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  paidBadgeText: { color: "#fff", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
  receiptAmount: { fontSize: 34, fontWeight: "800", color: "#fff", marginTop: 14 },
  receiptBody: { padding: 22, paddingTop: 8 },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F4",
    gap: 12,
  },
  receiptLabel: { color: "#6B7B85", fontSize: 13 },
  receiptValue: { color: "#1B2B33", fontSize: 13, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  downloadBtn: {
    backgroundColor: "#0B6E8F",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 20,
  },
  downloadBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  closeBtn: {
    backgroundColor: "#EEF2F4",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
  },
  closeBtnText: { color: "#0B6E8F", fontWeight: "700", fontSize: 15 },
});
