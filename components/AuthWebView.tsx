"use client"

import { View, StyleSheet, TouchableOpacity, Text } from "react-native"
import { WebView } from "react-native-webview"
import { MaterialIcons } from "@expo/vector-icons"
import { COLORS } from "@/utils/constants"

interface AuthWebViewProps {
    url: string
    onNavigation: (event: any) => void
    onClose: () => void
}

export function AuthWebView({ url, onNavigation, onClose }: AuthWebViewProps) {
    return (
        <View style={styles.container}>
            {/* Header with close button */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Sign In</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <MaterialIcons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            {/* WebView */}
            <WebView
                source={{ uri: url }}
                onNavigationStateChange={onNavigation}
                style={styles.webView}
                startInLoadingState={true}
                scalesPageToFit={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1000,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50, // Account for status bar
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.text,
    },
    closeButton: {
        padding: 8,
    },
    webView: {
        flex: 1,
    },
})
