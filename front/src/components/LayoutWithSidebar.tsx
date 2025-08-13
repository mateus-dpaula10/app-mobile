import { Box, HStack, Icon, ScrollView, Text, VStack } from "native-base";
import React from "react";
import { sidebarOptions } from "../data/sidebarOptions";
import { Pressable } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { LucideIcon } from "lucide-react-native";

type LayoutProps = {
    children: React.ReactNode;
};

export default function LayoutWithSidebar({ children }: LayoutProps) {
    const { user, logout } = useAuth();
    const navigation = useNavigation();
    const role = user?.role || 'client';
    const menuItems = sidebarOptions[role] || [];

    return (
        <HStack flex={1}>
            <Box w="32" bg="gray.800" px="2" py="4">
                <VStack space="4">
                    <Text color="white" fontSize="lg" bold mb="4">Menu</Text>

                    {menuItems.map((item, index) => {
                        const IconComponent: LucideIcon = item.icon;

                        return (
                            <Pressable key={index} onPress={() => navigation.navigate(item.screen as never)}>
                                <HStack alignItems="center" space="2">
                                    <Icon as={IconComponent} size="5" color="white" />
                                    <Text color="white">{item.label}</Text>
                                </HStack>
                            </Pressable>
                        );
                    })}

                    <Pressable onPress={logout}>
                        <Text color="red.400" mt="8">Sair</Text>
                    </Pressable>
                </VStack>
            </Box>

            <ScrollView flex={1} bg="white" p="4">
                {children}
            </ScrollView>
        </HStack>
    );
}