
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  authProvider: { type: String, enum: ["Google", "Email"], required: true },
  linkedin: { type: String },
  github: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Automatically exclude password in all responses
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.model("User", userSchema);
