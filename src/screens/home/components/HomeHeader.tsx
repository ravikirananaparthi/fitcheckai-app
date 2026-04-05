import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '@constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const BG = Theme.colors.background.light;
const DARK = Theme.palette.surface.dark;
const TEAL = Theme.palette.accent;

export default function HomeHeader() {
    return (
        <View style={styles.header}>
            <View style={styles.headerLogo}>
                <MaterialCommunityIcons name="hanger" size={20} color={DARK} style={{ marginRight: 6 }} />
                <Text style={styles.headerLogoText}>FITCHECK AI</Text>
            </View>
            <View style={styles.bellWrapper}>
                <Ionicons name="notifications-outline" size={22} color={DARK} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: BG,
    },
    headerLogo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogoText: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1.2,
        color: DARK,
    },
    bellWrapper: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: TEAL,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
