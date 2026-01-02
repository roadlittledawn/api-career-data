// MongoDB connection and operations
import {
  MongoClient,
  Db,
  Collection,
  ObjectId,
  Document,
  Filter,
  Sort,
  WithId,
  OptionalUnlessRequiredId,
} from "mongodb";

// Connection caching for Lambda warm starts
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connects to MongoDB with connection caching for Lambda warm starts.
 * Reuses existing connections across invocations to minimize latency.
 */
export async function connectToDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: 60000,
      });
      await cachedClient.connect();
    }

    cachedDb = cachedClient.db();
    return cachedDb;
  } catch (error) {
    // Reset cached values on connection failure
    cachedClient = null;
    cachedDb = null;
    throw new Error(
      `Failed to connect to MongoDB: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Gets a typed MongoDB collection.
 * @param name - The collection name
 * @returns Promise resolving to the typed collection
 */
export async function getCollection<T extends Document>(
  name: string
): Promise<Collection<T>> {
  const db = await connectToDatabase();
  return db.collection<T>(name);
}

/**
 * Closes the MongoDB connection. Useful for testing cleanup.
 */
export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

export { ObjectId };
export type { Filter, Sort, WithId, OptionalUnlessRequiredId };

// ============================================================================
// Type Definitions for Career Data Entities
// ============================================================================

export interface PersonalInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Positioning {
  headline: string;
  summary: string;
}

export interface Profile {
  _id?: ObjectId;
  personalInfo: PersonalInfo;
  positioning: Positioning;
  valuePropositions: string[];
  professionalMission: string;
  uniqueSellingPoints: string[];
  updatedAt: Date;
}

export interface Achievement {
  description: string;
  metrics?: string;
}

export interface Experience {
  _id?: ObjectId;
  company: string;
  location: string;
  title: string;
  industry?: string;
  startDate: Date;
  endDate?: Date;
  roleTypes: string[];
  responsibilities: string[];
  achievements: Achievement[];
  technologies: string[];
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  _id?: ObjectId;
  name: string;
  roleRelevance: string;
  level: string;
  rating: number;
  yearsOfExperience: number;
  tags: string[];
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  _id?: ObjectId;
  name: string;
  type: string;
  date?: Date;
  featured: boolean;
  overview: string;
  challenge?: string;
  approach?: string;
  outcome?: string;
  impact?: string;
  technologies: string[];
  keywords: string[];
  roleTypes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Education {
  _id?: ObjectId;
  institution: string;
  degree: string;
  field: string;
  graduationYear: number;
  relevantCoursework: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface ExperienceFilter {
  company?: string;
  title?: string;
  industry?: string;
  roleType?: string;
  technology?: string;
  featured?: boolean;
}

export interface SkillFilter {
  name?: string;
  roleRelevance?: string;
  level?: string;
  tag?: string;
}

export interface ProjectFilter {
  name?: string;
  type?: string;
  technology?: string;
  roleType?: string;
  featured?: boolean;
}

export interface EducationFilter {
  institution?: string;
  degree?: string;
  field?: string;
}

// ============================================================================
// Collection Names
// ============================================================================

export const COLLECTIONS = {
  PROFILES: "careerprofiles",
  EXPERIENCES: "experiences",
  SKILLS: "skills",
  PROJECTS: "projects",
  EDUCATIONS: "educations",
} as const;

// ============================================================================
// Default Sort Orders per Entity Type
// ============================================================================

const SORT_ORDERS: Record<string, Sort> = {
  [COLLECTIONS.EXPERIENCES]: { startDate: -1 },
  [COLLECTIONS.SKILLS]: { name: 1 },
  [COLLECTIONS.PROJECTS]: { date: -1 },
  [COLLECTIONS.EDUCATIONS]: { graduationYear: -1 },
};

// ============================================================================
// Filter Query Builders
// ============================================================================

export function buildExperienceFilter(
  filter?: ExperienceFilter
): Filter<Experience> {
  if (!filter) return {};

  const query: Filter<Experience> = {};

  if (filter.company) {
    query.company = { $regex: filter.company, $options: "i" };
  }
  if (filter.title) {
    query.title = { $regex: filter.title, $options: "i" };
  }
  if (filter.industry) {
    query.industry = { $regex: filter.industry, $options: "i" };
  }
  if (filter.roleType) {
    query.roleTypes = filter.roleType;
  }
  if (filter.technology) {
    query.technologies = filter.technology;
  }
  if (filter.featured !== undefined) {
    query.featured = filter.featured;
  }

  return query;
}

export function buildSkillFilter(filter?: SkillFilter): Filter<Skill> {
  if (!filter) return {};

  const query: Filter<Skill> = {};

  if (filter.name) {
    query.name = { $regex: filter.name, $options: "i" };
  }
  if (filter.roleRelevance) {
    query.roleRelevance = filter.roleRelevance;
  }
  if (filter.level) {
    query.level = filter.level;
  }
  if (filter.tag) {
    query.tags = filter.tag;
  }

  return query;
}

export function buildProjectFilter(filter?: ProjectFilter): Filter<Project> {
  if (!filter) return {};

  const query: Filter<Project> = {};

  if (filter.name) {
    query.name = { $regex: filter.name, $options: "i" };
  }
  if (filter.type) {
    query.type = filter.type;
  }
  if (filter.technology) {
    query.technologies = filter.technology;
  }
  if (filter.roleType) {
    query.roleTypes = filter.roleType;
  }
  if (filter.featured !== undefined) {
    query.featured = filter.featured;
  }

  return query;
}

export function buildEducationFilter(
  filter?: EducationFilter
): Filter<Education> {
  if (!filter) return {};

  const query: Filter<Education> = {};

  if (filter.institution) {
    query.institution = { $regex: filter.institution, $options: "i" };
  }
  if (filter.degree) {
    query.degree = { $regex: filter.degree, $options: "i" };
  }
  if (filter.field) {
    query.field = { $regex: filter.field, $options: "i" };
  }

  return query;
}

// ============================================================================
// Generic CRUD Operations
// ============================================================================

/**
 * Finds all documents in a collection with optional filtering and sorting.
 */
export async function findAll<T extends Document>(
  collectionName: string,
  filter: Filter<T> = {},
  sort?: Sort
): Promise<WithId<T>[]> {
  const collection = await getCollection<T>(collectionName);
  const sortOrder = sort || SORT_ORDERS[collectionName] || {};
  return collection.find(filter).sort(sortOrder).toArray();
}

/**
 * Finds a single document by its ObjectId.
 */
export async function findById<T extends Document>(
  collectionName: string,
  id: string | ObjectId
): Promise<WithId<T> | null> {
  const collection = await getCollection<T>(collectionName);
  const objectId = typeof id === "string" ? new ObjectId(id) : id;
  return collection.findOne({ _id: objectId } as Filter<T>);
}

/**
 * Creates a new document in the collection.
 * Automatically adds createdAt and updatedAt timestamps.
 */
export async function create<T extends Document>(
  collectionName: string,
  data: Omit<T, "_id" | "createdAt" | "updatedAt">
): Promise<WithId<T>> {
  const collection = await getCollection<T>(collectionName);
  const now = new Date();
  const document = {
    ...data,
    createdAt: now,
    updatedAt: now,
  } as unknown as OptionalUnlessRequiredId<T>;

  const result = await collection.insertOne(document);
  return { ...document, _id: result.insertedId } as WithId<T>;
}

/**
 * Updates an existing document by its ObjectId.
 * Automatically updates the updatedAt timestamp.
 */
export async function update<T extends Document>(
  collectionName: string,
  id: string | ObjectId,
  data: Partial<Omit<T, "_id" | "createdAt">>
): Promise<WithId<T> | null> {
  const collection = await getCollection<T>(collectionName);
  const objectId = typeof id === "string" ? new ObjectId(id) : id;

  const updateData = {
    ...data,
    updatedAt: new Date(),
  };

  const result = await collection.findOneAndUpdate(
    { _id: objectId } as Filter<T>,
    { $set: updateData as unknown as Partial<T> },
    { returnDocument: "after" }
  );

  return result as WithId<T> | null;
}

/**
 * Deletes a document by its ObjectId.
 * Returns true if a document was deleted, false otherwise.
 */
export async function deleteById(
  collectionName: string,
  id: string | ObjectId
): Promise<boolean> {
  const collection = await getCollection(collectionName);
  const objectId = typeof id === "string" ? new ObjectId(id) : id;
  const result = await collection.deleteOne({ _id: objectId });
  return result.deletedCount === 1;
}

// ============================================================================
// Profile-Specific Operations (Singleton)
// ============================================================================

/**
 * Gets the profile document (singleton).
 */
export async function getProfile(): Promise<WithId<Profile> | null> {
  const collection = await getCollection<Profile>(COLLECTIONS.PROFILES);
  return collection.findOne({});
}

/**
 * Updates or creates the profile document (upsert).
 */
export async function updateProfile(
  data: Omit<Profile, "_id" | "updatedAt">
): Promise<WithId<Profile>> {
  const collection = await getCollection<Profile>(COLLECTIONS.PROFILES);
  const updateData = {
    ...data,
    updatedAt: new Date(),
  };

  const result = await collection.findOneAndUpdate(
    {},
    { $set: updateData },
    { upsert: true, returnDocument: "after" }
  );

  return result as WithId<Profile>;
}

// ============================================================================
// Entity-Specific Repository Functions
// ============================================================================

// Experience Repository
export const experienceRepository = {
  findAll: (filter?: ExperienceFilter) =>
    findAll<Experience>(COLLECTIONS.EXPERIENCES, buildExperienceFilter(filter)),
  findById: (id: string | ObjectId) =>
    findById<Experience>(COLLECTIONS.EXPERIENCES, id),
  create: (data: Omit<Experience, "_id" | "createdAt" | "updatedAt">) =>
    create<Experience>(COLLECTIONS.EXPERIENCES, data),
  update: (
    id: string | ObjectId,
    data: Partial<Omit<Experience, "_id" | "createdAt">>
  ) => update<Experience>(COLLECTIONS.EXPERIENCES, id, data),
  delete: (id: string | ObjectId) => deleteById(COLLECTIONS.EXPERIENCES, id),
};

// Skill Repository
export const skillRepository = {
  findAll: (filter?: SkillFilter) =>
    findAll<Skill>(COLLECTIONS.SKILLS, buildSkillFilter(filter)),
  findById: (id: string | ObjectId) => findById<Skill>(COLLECTIONS.SKILLS, id),
  create: (data: Omit<Skill, "_id" | "createdAt" | "updatedAt">) =>
    create<Skill>(COLLECTIONS.SKILLS, data),
  update: (
    id: string | ObjectId,
    data: Partial<Omit<Skill, "_id" | "createdAt">>
  ) => update<Skill>(COLLECTIONS.SKILLS, id, data),
  delete: (id: string | ObjectId) => deleteById(COLLECTIONS.SKILLS, id),
};

// Project Repository
export const projectRepository = {
  findAll: (filter?: ProjectFilter) =>
    findAll<Project>(COLLECTIONS.PROJECTS, buildProjectFilter(filter)),
  findById: (id: string | ObjectId) =>
    findById<Project>(COLLECTIONS.PROJECTS, id),
  create: (data: Omit<Project, "_id" | "createdAt" | "updatedAt">) =>
    create<Project>(COLLECTIONS.PROJECTS, data),
  update: (
    id: string | ObjectId,
    data: Partial<Omit<Project, "_id" | "createdAt">>
  ) => update<Project>(COLLECTIONS.PROJECTS, id, data),
  delete: (id: string | ObjectId) => deleteById(COLLECTIONS.PROJECTS, id),
};

// Education Repository
export const educationRepository = {
  findAll: (filter?: EducationFilter) =>
    findAll<Education>(COLLECTIONS.EDUCATIONS, buildEducationFilter(filter)),
  findById: (id: string | ObjectId) =>
    findById<Education>(COLLECTIONS.EDUCATIONS, id),
  create: (data: Omit<Education, "_id" | "createdAt" | "updatedAt">) =>
    create<Education>(COLLECTIONS.EDUCATIONS, data),
  update: (
    id: string | ObjectId,
    data: Partial<Omit<Education, "_id" | "createdAt">>
  ) => update<Education>(COLLECTIONS.EDUCATIONS, id, data),
  delete: (id: string | ObjectId) => deleteById(COLLECTIONS.EDUCATIONS, id),
};
