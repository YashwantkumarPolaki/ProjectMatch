import { useState } from "react";
import styles from "./TagInput.module.css";

export default function TagInput({
  selectedTags = [],
  onChange,
  suggestedTags = [],
  placeholder = "Add custom tag...",
}) {
  const [inputValue, setInputValue] = useState("");

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onChange([...selectedTags, trimmed]);
      setInputValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddCustom();
    }
  };

  // Combine suggestedTags and any selected tags not in suggestedTags
  const allDisplayTags = [
    ...suggestedTags,
    ...selectedTags.filter((t) => !suggestedTags.includes(t)),
  ];

  return (
    <div className={styles.container}>
      <div className={styles.tagsRow}>
        {allDisplayTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <span
              key={tag}
              className={`${styles.chip} ${isSelected ? styles.chipSelected : ""}`}
              onClick={() => toggleTag(tag)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && toggleTag(tag)}
            >
              {isSelected && <span className={styles.chipCheck}>✓</span>}
              {tag}
            </span>
          );
        })}
      </div>

      <div className={styles.inputWrap}>
        <input
          type="text"
          className={styles.customInput}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={styles.addBtn}
          onClick={handleAddCustom}
        >
          Add
        </button>
      </div>
    </div>
  );
}
