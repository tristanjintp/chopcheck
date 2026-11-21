import assert from "node:assert/strict";
import { isValidUscc, validateUscc } from "../../lib/rules/uscc";

// Ce code est un exemple de code USCC valide utilisé uniquement pour le test.
const validUscc = "91350211M000100Y43";

// Un code correct doit être accepté par la validation.
assert.equal(isValidUscc(validUscc), true);

// Modifier le dernier caractère doit rendre le code invalide.
assert.equal(isValidUscc(`${validUscc.slice(0, -1)}4`), false);

// Une chaîne trop courte ne peut pas être un USCC valide.
assert.equal(isValidUscc("123456789"), false);

// Une lettre interdite doit également être refusée.
assert.equal(isValidUscc("91350211I000100Y43"), false);

// Un code absent ou correct ne produit aucun risque.
assert.deepEqual(validateUscc("", "Example Company"), []);
assert.deepEqual(validateUscc(validUscc, "Example Company"), []);

// Un code incorrect produit un risque exploitable par l'agrégateur.
const risks = validateUscc("91350211M000100Y44", "Example Company");
assert.equal(risks.length, 1);
assert.equal(risks[0].source, "rule");
assert.equal(risks[0].level, "critical");

console.log("USCC rules: all tests passed");
