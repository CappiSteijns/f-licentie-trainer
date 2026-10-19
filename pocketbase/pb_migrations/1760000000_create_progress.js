/// <reference path="../pb_data/types.d.ts" />
// Maakt de collectie 'progress' aan: één rij per gebruiker, met de voortgang als JSON.
// De regels zorgen dat iedereen alleen zijn EIGEN rij kan lezen, aanmaken, wijzigen en verwijderen.
// Wordt automatisch uitgevoerd bij het opstarten van PocketBase (vereist PocketBase v0.23 of nieuwer).
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  const collection = new Collection({
    type: "base",
    name: "progress",
    listRule: "user = @request.auth.id",
    viewRule: "user = @request.auth.id",
    createRule: "@request.auth.id != '' && @request.body.user = @request.auth.id",
    updateRule: "user = @request.auth.id && @request.body.user:isset = false",
    deleteRule: "user = @request.auth.id",
    fields: [
      { type: "relation", name: "user", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
      { type: "json", name: "data", maxSize: 200000 },
    ],
    indexes: ["CREATE UNIQUE INDEX `idx_progress_user` ON `progress` (`user`)"],
  });

  app.save(collection);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("progress"));
});
