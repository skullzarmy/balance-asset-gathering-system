"use client";

import { HardDrive, Eye, Download, CheckCircle } from "lucide-react";
import Footer from "@/components/footer";
import { SimpleHeader } from "@/components/header-simple";
import { ShieldCheckIcon } from "@/components/ShieldCheckIcon";
import { motion } from "framer-motion";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SimpleHeader />

            <div className="container max-w-5xl mx-auto px-4 py-12 sm:py-20">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 sm:mb-24"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
                        <ShieldCheckIcon size={40} autoPlay className="text-primary" />
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-bold mb-4">
                        Your Data.
                        <br />
                        <span className="text-primary">Your Device.</span>
                    </h1>
                    <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
                        Zero tracking. Zero servers. Zero compromise.
                    </p>
                </motion.div>

                {/* Key Points Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
                >
                    <motion.div
                        variants={item}
                        className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-colors"
                    >
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                            <HardDrive className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Local Storage Only</h3>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Your wallet data lives in your browser. No cloud sync, no remote servers, no database.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={item}
                        className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-colors"
                    >
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                            <Eye className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Zero Tracking</h3>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            No analytics. No cookies. No fingerprinting. We literally can't see what you're doing.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={item}
                        className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-colors"
                    >
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                            <CheckCircle className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">No Account Needed</h3>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            No sign up, no email, no password. Just open the app and start tracking your wallets.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={item}
                        className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-colors"
                    >
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                            <Download className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">You Control Backups</h3>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Export your data anytime. Import it anywhere. Your backup, your responsibility.
                        </p>
                    </motion.div>
                </motion.div>

                {/* How It Works */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-primary/5 border border-primary/20 rounded-2xl p-8 sm:p-12 mb-16"
                >
                    <h2 className="text-3xl font-bold mb-6">How It Actually Works</h2>
                    <div className="space-y-4 text-lg leading-relaxed">
                        <p>
                            When you add a wallet, your browser saves it to{" "}
                            <span className="font-semibold text-foreground">localStorage</span> — a simple storage area
                            built into every browser.
                        </p>
                        <p>
                            To show balances, your browser talks directly to public blockchain APIs (like TzKT). These
                            APIs see the wallet addresses you're checking, but they don't know who you are or that
                            you're using BAGS.
                        </p>
                        <p>
                            Think of it like reading a public bulletin board — the information is already public on the
                            blockchain. We're just helping you view it.
                        </p>
                    </div>
                </motion.div>

                {/* Warning Box */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl p-8"
                >
                    <div className="flex items-start gap-4">
                        <div className="text-3xl">⚠️</div>
                        <div>
                            <h3 className="text-2xl font-bold mb-3">Important: Backup Your Data!</h3>
                            <p className="text-lg mb-4">
                                Since everything is local, <strong>you're responsible for keeping a backup</strong>.
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-lg marker:text-yellow-500">
                                <li>Clearing browser data = losing your wallet list</li>
                                <li>Different browser/device = fresh start</li>
                                <li>We can't recover your data if you lose it</li>
                            </ul>
                            <p className="mt-4 text-lg font-semibold">
                                Use the <span className="text-primary">Export</span> button to save a backup file!
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-16 sm:mt-24"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">Privacy by Design</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Not by promise. Not by policy. By the way the app is built.
                    </p>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
}
