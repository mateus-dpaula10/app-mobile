import React, { useEffect, useState } from 'react';
import { Box, Button, CheckIcon, Input, Select, Text, useToast, VStack } from 'native-base';
import LayoutWithSidebar from '../../components/LayoutWithSidebar';
import api from '../../services/api';
import { FlatList, useWindowDimensions } from 'react-native';
import axios from 'axios';
import { Alert } from 'react-native';
import { isStrongPassword } from '../../utils/validatePassword';
import { Admin, Company } from '../../type/Store';
 
export default function ManageUsers() {
    const toast = useToast();
    const [company, setCompany] = useState<Company>({
        cnpj: '',
        legal_name: '',
        final_name: '',
        phone: '',
        address: '',
        plan: ''
    })
    const [admin, setAdmin] = useState<Admin>({
        name: '',
        email: '',
        password: ''
    });
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [passwordValid, setPasswordValid] = useState(true);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await api.get('/companies');
                setCompanies(res.data);
            } catch (err) {
                console.error('Erro ao carregar empresas:', err);
            }
        };

        fetchCompanies();
    }, []);

    const fetchCNPJData = async (cnpj: string) => {
        try {
            const cleanCNPJ = cnpj.replace(/\D/g, '');
            const { data } = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);

            setCompany(c => ({
                ...c,
                legal_name: data.razao_social || '',
                phone: data.ddd_telefone_1 ? `${data.ddd_telefone_1}` : '',
                address: `${data.descricao_tipo_de_logradouro} ${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio} - ${data.uf}, ${data.cep}`,
            }));
        } catch (error) {
            Alert.alert('Erro ao buscar CNPJ', 'CNPJ inválido ou não encontrado.');
        }
    };

    const handleSubmit = async () => {
        setSaving(true);

        try {
            const isEditMode = !!company.id;

            if (!isEditMode && !isStrongPassword(admin.password || '')) {
                toast.show({
                    title: 'Senha fraca',
                    description: 'A senha deve conter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.',
                    duration: 3000
                });
                return;
            } 

            if (isEditMode) {
                await api.put(`/companies/${company.id}`, {
                    ...company,
                    admin: admin.email ? admin : undefined
                });
    
                toast.show({
                    title: 'Empresa atualizada',
                    description: 'A empresa foi atualizada com sucesso.',
                    duration: 3000
                });
            } else {
                await api.post('/companies', {
                    ...company,
                    admin
                });

                toast.show({
                    title: 'Empresa cadastrada',
                    description: 'A empresa foi cadastrada com sucesso.',
                    duration: 3000
                });
            }

            setCompany({
                legal_name: '',
                final_name: '',
                cnpj: '',
                phone: '',
                address: '',
                plan: ''
            });

            setAdmin({
                name: '',
                email: '',
                password: ''
            });

            const response = await api.get('/companies');
            setCompanies(response.data);
        } catch (error) {
            toast.show({
                title: 'Erro ao cadastrar',
                description: 'A empresa não foi cadastrada.',
                duration: 3000
            });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (company: Company) => {
        setCompany({
            id: company.id,
            cnpj: company.cnpj ?? '',
            legal_name: company.legal_name ?? '',
            final_name: company.final_name ?? '',
            phone: company.phone ?? '',
            address: company.address ?? '',
            plan: company.plan ?? ''
        });

        if (company.admin) {
            setAdmin({
                name: company.admin.name ?? '',
                email: company.admin.email ?? '',
                password: ''
            });
        } else {
            setAdmin({ name: '', email: '', password: '' });
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/companies/${id}`);
            setCompanies((prev) => prev.filter((c) => c.id !== id));

            toast.show({
                title: 'Empresa excluída',
                description: 'A empresa foi removida com sucesso.',
                duration: 3000
            });
        } catch (err) {
            console.error(err);

            toast.show({
                title: 'Erro ao excluir',
                description: 'Ocorreu um erro ao tentar excluir a empresa.',
                duration: 3000
            });
        }
    };
    
    const { width } = useWindowDimensions();
    const numColumns = width < 500 ? 1 : width < 900 ? 2 : 3;

    const renderCompanyCard = ({ item }: { item: Company }) => (
        <Box
            flex={1}
            borderWidth={1}
            borderColor="gray.200"
            borderRadius="lg"
            bg="white"
            shadow={2}
            overflow="hidden"
            m={2}
        >
            <VStack p={3} space={2}>
                <Text bold fontSize="md">{item.final_name}</Text>
                <Text fontSize="sm" color="gray.600">CNPJ: {item.cnpj}</Text>
                <Text fontSize="sm" color="gray.600">Admin: {item.admin?.email || 'Não cadastrado'}</Text>
                {item.plan && <Text fontSize="sm" color="gray.600">Plano: {item.plan}</Text>}

                <Box flexDirection="row" mt={2} justifyContent="flex-start">
                    <Button 
                        size="sm" 
                        colorScheme="blue" 
                        mr={2}
                        onPress={() => handleEdit(item)}
                        >
                        Editar
                    </Button>
                    <Button 
                        size="sm" 
                        colorScheme="red" 
                        onPress={() => item.id !== undefined && handleDelete(item.id)}
                        >
                        Excluir
                    </Button>
                </Box>
            </VStack>
        </Box>
    );

    function formatPhone(value: string) {
        const digits = value.replace(/\D/g, ""); 

        if (digits.length <= 10) {
            return digits.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (match, ddd, part1, part2) => {
            if (!part1) return ddd;
            if (!part2) return `(${ddd}) ${part1}`;
            return `(${ddd}) ${part1}-${part2}`;
            });
        } else {
            return digits.replace(/(\d{0,2})(\d{0,5})(\d{0,4})/, (match, ddd, part1, part2) => {
            if (!part1) return ddd;
            if (!part2) return `(${ddd}) ${part1}`;
            return `(${ddd}) ${part1}-${part2}`;
            });
        }
    }

    return (
        <LayoutWithSidebar>
            <VStack mt={10}>
                <Text bold>Cadastro da loja</Text>
                
                <Input 
                    placeholder="CNPJ" 
                    value={company.cnpj} 
                    keyboardType="numeric" 
                    onChangeText={v => setCompany(c => ({ ...c, cnpj: v }))} 
                    onBlur={() => fetchCNPJData(company.cnpj)}
                    mt={2}
                />
                <Input 
                    placeholder="Razão social" 
                    value={company.legal_name} 
                    mt={1}
                    onChangeText={v => setCompany(c => ({ ...c, legal_name: v }))} 
                />    
                <Input
                    placeholder="Telefone"
                    value={formatPhone(company.phone)}
                    mt={1}
                    onChangeText={v => setCompany(c => ({ ...c, phone: v.replace(/\D/g, "") }))}
                />
                <Input
                    placeholder="Endereço"
                    value={company.address}
                    mt={1}
                    onChangeText={v => setCompany(c => ({ ...c, address: v }))}
                /> 
                <Input 
                    placeholder="Nome da loja" 
                    value={company.final_name} 
                    mt={1}
                    onChangeText={v => setCompany(c => ({ ...c, final_name: v }))} 
                />             
                <Select
                    selectedValue={company.plan}
                    minWidth="200"
                    accessibilityLabel="Selecione o plano"
                    placeholder="Plano contratado"
                    _selectedItem={{
                        bg: 'teal.600',
                        endIcon: <CheckIcon size={4} />,
                    }}
                    mt={1}
                    onValueChange={value => setCompany(c => ({ ...c, plan: value }))}
                >
                    <Select.Item label="Plano padrão" value="padrao" />
                </Select>

                <Text bold mt={4}>Admin da loja</Text>
                <Input 
                    placeholder="Nome" 
                    value={admin.name}
                    mt={2}
                    onChangeText={v => setAdmin(a => ({ ...a, name: v }))} 
                />
                <Input 
                    placeholder="E-mail" 
                    value={admin.email}
                    mt={1}
                    onChangeText={v => setAdmin(a => ({ ...a, email: v }))} 
                />
                <Input 
                    placeholder="Senha" 
                    value={admin.password}
                    secureTextEntry 
                    mt={1}
                    borderColor={ (admin.password || '').length > 0 && !passwordValid ? 'red.500' : 'gray.300'}
                    onChangeText={v => {
                        setAdmin(a => ({ ...a, password: v }));
                        setPasswordValid(isStrongPassword(v));
                    }} 
                />
                { (admin.password || '').length > 0 && !passwordValid && (
                    <Text color="red.500" fontSize="xs">
                        A senha deve conter ao menos 8 caracteres, com letra maiúscula, minúscula, número e símbolo.
                    </Text>
                )}

                <Button onPress={handleSubmit} isLoading={saving} mt={2}>Cadastrar</Button>

                {loading ? (
                    <Text mt={10}>Carregando empresas...</Text>
                ) : (                
                    <FlatList
                        data={companies}
                        keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
                        numColumns={numColumns}
                        columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between' } : undefined}
                        renderItem={renderCompanyCard}
                    />
                )}
            </VStack>            
        </LayoutWithSidebar>
    );
}