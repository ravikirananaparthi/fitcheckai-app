import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export interface IconProps {
    size?: number;
    color?: string;
    style?: any;
}

export const WardrobeIconUF = ({ size = 24, color = '#fff', style }: IconProps) => {
    return <Ionicons name="shirt-outline" size={size} color={color} style={style} />;
};