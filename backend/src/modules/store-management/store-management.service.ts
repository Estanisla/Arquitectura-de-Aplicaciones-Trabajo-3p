import { AppError } from "../../shared/AppError.js";
import { storeManagementRepository } from "./store-management.repository.js";
import type {
  CreateManagedStoreInput,
  ManagedStoreCollection,
  StoreContactInput,
  StoreContactChannel,
} from "./store-management.types.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTACT_CHANNELS = new Set<StoreContactChannel>([
  "whatsapp",
  "instagram",
  "facebook",
  "email",
  "website",
]);

const validateAdmin = (adminId: string) => {
  if (!UUID_REGEX.test(adminId)) {
    throw new AppError("Solicitud invalida", 400);
  }
};

const normalizeContacts = (
  contactsInput: StoreContactInput[],
): StoreContactInput[] => {
  if (!Array.isArray(contactsInput) || contactsInput.length > 5) {
    throw new AppError("Contacto invalido", 400);
  }

  const contacts = contactsInput.map((contact) => {
    const value = contact.value?.trim();
    if (
      !CONTACT_CHANNELS.has(contact.channel)
      || !value
      || value.length < 3
      || value.length > 300
    ) {
      throw new AppError("Contacto invalido", 400);
    }
    return { channel: contact.channel, value };
  });

  if (new Set(contacts.map((contact) => contact.channel)).size !== contacts.length) {
    throw new AppError("Los canales de contacto no deben repetirse", 400);
  }
  return contacts;
};

const normalizeInput = (
  input: CreateManagedStoreInput,
): CreateManagedStoreInput => {
  const emporiumName = input.emporiumName?.trim();
  const displayName = input.displayName?.trim();

  if (!emporiumName || emporiumName.length < 2 || emporiumName.length > 120) {
    throw new AppError("Nombre de emporio invalido", 400);
  }

  if (!displayName || displayName.length < 2 || displayName.length > 120) {
    throw new AppError("Nombre de tienda invalido", 400);
  }

  if (!Array.isArray(input.members) || input.members.length < 1) {
    throw new AppError("La tienda requiere al menos un usuario", 400);
  }

  if (input.members.length > 20) {
    throw new AppError("Cantidad de usuarios invalida", 400);
  }

  const ownerCount = input.members.filter(
    (member) => member.role === "owner",
  ).length;
  if (ownerCount !== 1) {
    throw new AppError("La tienda requiere exactamente un propietario", 400);
  }

  const usernames = new Set<string>();
  const members = input.members.map((member) => {
    const username = member.username?.trim();
    if (!username || username.length < 3 || username.length > 80) {
      throw new AppError("Username invalido", 400);
    }

    const normalizedUsername = username.toLowerCase();
    if (usernames.has(normalizedUsername)) {
      throw new AppError("Los usernames deben ser unicos", 400);
    }
    usernames.add(normalizedUsername);

    if (!member.tempPassword || member.tempPassword.length < 6) {
      throw new AppError("Contrasena temporal invalida", 400);
    }

    if (member.role !== "owner" && member.role !== "manager") {
      throw new AppError("Rol de usuario invalido", 400);
    }

    return { ...member, username };
  });

  const contacts = normalizeContacts(input.contacts ?? []);

  const description = input.description?.trim();

  return {
    emporiumName,
    displayName,
    ...(description ? { description } : {}),
    members,
    contacts,
  };
};

export const storeManagementService = {
  async createStore(
    adminId: string,
    input: CreateManagedStoreInput,
  ): Promise<{ storeId: string; emporiumName: string }> {
    validateAdmin(adminId);
    const normalized = normalizeInput(input);
    const result = await storeManagementRepository.createStore(adminId, normalized);

    if (!result.ok || !result.store_id) {
      const status = result.message?.includes("ya existe") ? 409 : 400;
      throw new AppError(result.message ?? "No se pudo crear la tienda", status);
    }

    return {
      storeId: result.store_id,
      emporiumName: result.emporium_name ?? normalized.emporiumName,
    };
  },

  async listStores(adminId: string): Promise<ManagedStoreCollection> {
    validateAdmin(adminId);
    return storeManagementRepository.listStores(adminId);
  },

  async addMember(
    adminId: string,
    storeId: string,
    usernameInput: string,
    tempPassword: string,
  ): Promise<void> {
    validateAdmin(adminId);
    if (!UUID_REGEX.test(storeId)) {
      throw new AppError("Solicitud invalida", 400);
    }
    const username = usernameInput?.trim();
    if (
      !username
      || username.length < 3
      || username.length > 80
      || !tempPassword
      || tempPassword.length < 6
    ) {
      throw new AppError("Solicitud invalida", 400);
    }

    const created = await storeManagementRepository.addMember(
      adminId,
      storeId,
      { username, tempPassword },
    );
    if (!created) throw new AppError("El usuario ya existe", 409);
  },

  async setMemberActive(
    adminId: string,
    storeId: string,
    usernameInput: string,
    isActive: boolean,
  ): Promise<void> {
    validateAdmin(adminId);
    if (!UUID_REGEX.test(storeId) || typeof isActive !== "boolean") {
      throw new AppError("Solicitud invalida", 400);
    }
    const username = usernameInput?.trim();
    if (!username) throw new AppError("Solicitud invalida", 400);

    const updated = await storeManagementRepository.setMemberActive(
      adminId,
      storeId,
      username,
      isActive,
    );
    if (!updated) throw new AppError("Usuario no encontrado", 404);
  },

  async updateContacts(
    adminId: string,
    storeId: string,
    contactsInput: StoreContactInput[],
  ): Promise<void> {
    validateAdmin(adminId);
    if (!UUID_REGEX.test(storeId) || !Array.isArray(contactsInput)) {
      throw new AppError("Solicitud invalida", 400);
    }

    const normalized = normalizeContacts(contactsInput);

    const updated = await storeManagementRepository.updateContacts(
      adminId,
      storeId,
      normalized,
    );
    if (!updated) throw new AppError("No se pudieron actualizar los contactos", 400);
  },
};
