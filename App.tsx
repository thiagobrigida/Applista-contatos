import React, { useState, useEffect } from "react";
import { Text, TextInput, Button, View, FlatList, StyleSheet, Alert } from "react-native";
import * as SQLite from "expo-sqlite";


export default function App() {
  
  type Contato = {
    id: number;
    nome: string;
    telefone: string;
    email?: string;   
  }

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  const [contatos, setContatos] = useState<Contato[]>([]);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

useEffect(() => {
  const setupDatabase = async () => {
    try {
      const CREATE_TABLE_QUERY = `
        CREATE TABLE IF NOT EXISTS contatos ( 
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          nome TEXT NOT NULL,
          telefone TEXT NOT NULL,
          email TEXT
        );`;
      const db = await SQLite.openDatabaseAsync("contatos.db");
      await db.execAsync(CREATE_TABLE_QUERY);
      setDb(db);
    } catch (error) {
      console.error("Erro ao criar o banco de dados:", error);
    }
  };

  setupDatabase();
  }, []);

  useEffect(() => {
    if (db) {
      carregarContatos();
    }
  }, [db]);

  const carregarContatos = async () => {
    if (!db) return;
    const resultado = await db.getAllAsync<Contato>("SELECT * FROM contatos;");
    setContatos(resultado);
  }

  const salvarContato = async () => {
    if (!db) return;
    if (nome.trim() === "" || telefone.trim() === "") {
      Alert.alert("Erro", "Os Campos de Nome e Telefone são obrigatórios.");
      return;
    }
    if (editId) {
      await db.runAsync("UPDATE contatos SET nome = ?, telefone = ?, email = ? WHERE id = ?;", [nome, telefone, email, editId]);
      setEditId(null); 
    } else {
      await db.runAsync("INSERT INTO contatos(nome, telefone, email) VALUES (?, ?, ?);", [nome, telefone, email]);
    }
    setNome("");
    setTelefone("");
    setEmail("");
    carregarContatos();
  }

   const excluirContato = async (id: number) => {
    if (!db) return;

    Alert.alert(
      "Confirmar exclusão",
      "Realmente excluir este contato?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: async () => {
            await db.runAsync("DELETE FROM contatos WHERE id = ?;", [id]);
            carregarContatos();
          } 
        }
      ]
    );
  }

  const editarContato = (contato: Contato) => {
    setEditId(contato.id);
    setNome(contato.nome);
    setTelefone(contato.telefone);
    setEmail(contato.email || "");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Agenda de Contatos</Text>
      
      {/* entrada de dados */}
      <TextInput
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
        style={styles.textoInput}
      />
      <TextInput
        placeholder="Telefone"
        value={telefone}
        onChangeText={setTelefone}
        style={styles.textoInput}
        keyboardType="phone-pad"
      />
      <TextInput
        placeholder="Email (opcional)"
        value={email}
        onChangeText={setEmail}
        style={styles.textoInput}
        keyboardType="email-address"
      />
      
      {/* salvar / atualizar */}
      <Button title={editId ? "Atualizar Contato" : "Adicionar Contato"} onPress={salvarContato} />

      {/* listar contatos */}
      <FlatList
        data={contatos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.list}>
              <View style={styles.infoContainer}>
                <Text style={styles.listaNome}>{item.nome}</Text>
                <Text>{item.telefone}</Text>
                {item.email ? <Text style={styles.listaEmail}>{item.email}</Text> : null}
            </View>

            <View style={styles.botoesContainer}>
              <Button title="Editar" onPress={() => editarContato(item)} />
              <Button title="Excluir" color="red" onPress={() => excluirContato(item.id)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 20
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  textoInput: {
    borderWidth: 1,
    borderColor: "#c2c0c0ff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  list: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddddddff",
  },
  listaNome: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  infoContainer: {
    flex: 1,
    marginRight: 10,
  },

  botoesContainer: {
    flexDirection: "row",
    gap: 10,
  },

  listaEmail: {
    fontSize: 10,
    color: "#585858ff"
  }
});