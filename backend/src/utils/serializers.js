export const withMongoStyleId = (record) => {
  if (!record) return record;

  const normalized = {
    ...record,
    _id: record.id
  };

  if ("id" in normalized) {
    delete normalized.id;
  }

  return normalized;
};

export const withMongoStyleIds = (records) => records.map(withMongoStyleId);
