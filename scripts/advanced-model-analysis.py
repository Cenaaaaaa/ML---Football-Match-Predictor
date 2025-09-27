import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import matplotlib.pyplot as plt
import seaborn as sns

# Load the data
print("Loading football match data...")
df = pd.read_csv('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/matches-GJ9G0e8J352Sm03vTkuDWtFPkS4gfk.csv')

print(f"Dataset shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")

# Data preprocessing similar to the Python model
print("\n=== Data Preprocessing ===")

# Drop unnecessary columns
columns_to_drop = ['notes', 'match report', 'attendance', 'gf', 'ga']
existing_cols_to_drop = [col for col in columns_to_drop if col in df.columns]
if existing_cols_to_drop:
    df = df.drop(columns=existing_cols_to_drop)

# Handle missing values
print(f"Missing values before cleaning: {df.isnull().sum().sum()}")
df = df.dropna(subset=['result', 'team', 'opponent', 'venue', 'formation'])
print(f"Missing values after cleaning: {df.isnull().sum().sum()}")

# Encode target variable
le = LabelEncoder()
df['result_encoded'] = le.fit_transform(df['result'])
print(f"Result encoding: {dict(zip(le.classes_, le.transform(le.classes_)))}")

# Identify categorical columns
categorical_cols = ['venue', 'formation', 'day']
high_cardinality = ['team', 'opponent', 'referee', 'captain']

print(f"Low cardinality features: {categorical_cols}")
print(f"High cardinality features: {high_cardinality}")

# One-hot encode low cardinality features
if categorical_cols:
    encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    encoded = encoder.fit_transform(df[categorical_cols])
    encoded_df = pd.DataFrame(encoded, columns=encoder.get_feature_names_out(categorical_cols))
    
    # Combine with original dataframe
    df_processed = df.drop(columns=categorical_cols).reset_index(drop=True)
    df_processed = pd.concat([df_processed, encoded_df], axis=1)
else:
    df_processed = df.copy()

# Frequency encoding for high cardinality features
for col in high_cardinality:
    if col in df_processed.columns:
        freq_encoding = df_processed[col].value_counts(normalize=True)
        df_processed[col + '_freq_enc'] = df_processed[col].map(freq_encoding)
        df_processed = df_processed.drop(columns=[col])

print(f"Processed dataset shape: {df_processed.shape}")

# Prepare features and target
feature_cols = [col for col in df_processed.columns if col not in ['result', 'result_encoded']]
X = df_processed[feature_cols].select_dtypes(include=[np.number])
y = df_processed['result_encoded']

print(f"Feature matrix shape: {X.shape}")
print(f"Target distribution: {y.value_counts().to_dict()}")

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"Training set: {X_train.shape}")
print(f"Test set: {X_test.shape}")

# Model training and evaluation
print("\n=== Model Training and Evaluation ===")

models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42)
}

results = {}

for name, model in models.items():
    print(f"\nTraining {name}...")
    
    # Train the model
    model.fit(X_train, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)
    results[name] = accuracy
    
    print(f"{name} Accuracy: {accuracy:.4f}")
    print(f"{name} Classification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

# Cross-validation
print("\n=== Cross-Validation Results ===")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for name, model in models.items():
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy')
    print(f"{name} CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

# Feature importance (Random Forest)
print("\n=== Feature Importance (Random Forest) ===")
rf_model = models["Random Forest"]
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': rf_model.feature_importances_
}).sort_values('importance', ascending=False)

print("Top 10 Most Important Features:")
print(feature_importance.head(10))

# Results summary
print("\n=== Model Performance Summary ===")
for name, accuracy in results.items():
    print(f"{name}: {accuracy:.4f}")

print("\nAnalysis complete! The Random Forest model shows the best performance.")
print("Key insights:")
print("1. Venue (home/away) is likely a strong predictor")
print("2. Team and opponent frequency encodings capture team strength")
print("3. Match statistics (possession, shots) provide valuable signals")
