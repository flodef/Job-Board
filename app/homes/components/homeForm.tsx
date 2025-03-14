'use client';

import { clsx } from 'clsx/lite';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHomes } from '../../contexts/homesProvider';
import { HomeData } from '../../types/types';
import geographicZonesData from '../../data/geographicZone.json';
import Combobox from '../../components/combobox';
import ConfirmationModal from '../../components/confirmationModal';
import FormActions from '../../components/formActions';
import FullScreenModal from '../../components/fullScreenModal';
import TaskList from '../../components/taskList';
import { ToastMessage, ToastProps, ToastType } from '../../components/toastMessage';
import { useMissions } from '../../contexts/missionsProvider';

type HomeFormProps = {
  onClose: () => void;
  onCancel?: () => void;
  home?: HomeData;
  mode?: 'add' | 'edit';
};

export default function HomeForm({ onClose, onCancel, home, mode = 'add' }: HomeFormProps) {
  const { addHome, updateHome, homeExists } = useHomes();
  const { getCurrentConciergerie } = useMissions();

  // Default mockup image path
  const mockupImagePath = '/home.webp';

  const [title, setTitle] = useState(home?.title || '');
  const [description, setDescription] = useState(home?.description || '');
  const [tasks, setTasks] = useState<string[]>(home?.tasks || ['']);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(home?.images || []);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [geographicZone, setGeographicZone] = useState<string>(home?.geographicZone || '');
  const [geographicZones, setGeographicZones] = useState<string[]>([]);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>();
  const [toastMessage, setToastMessage] = useState<ToastProps>();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<{
    title: string;
    description: string;
    tasks: string[];
    geographicZone: string;
  }>();

  // Validation states
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  // Refs for form elements
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);
  const imageUploadRef = useRef<HTMLLabelElement>(null);

  const currentConciergerie = getCurrentConciergerie();

  // Constants for validation
  const MAX_DESCRIPTION_LENGTH = 500;
  const isFormValid =
    (images.length > 0 || existingImages.length > 0) &&
    description.trim() !== '' &&
    tasks.some(task => task.trim() !== '') &&
    title.trim() !== '' &&
    geographicZone.trim() !== '';

  // Load geographic zones from JSON file
  useEffect(() => {
    setGeographicZones(geographicZonesData);

    // Save initial form state for comparison
    setInitialFormValues({
      title,
      description,
      tasks: [...tasks],
      geographicZone,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if form has been modified
  const checkFormChanged = useCallback(() => {
    if (!initialFormValues) return false;

    // Check if any field has been filled in compared to initial state
    const titleChanged = title !== initialFormValues.title;
    const descriptionChanged = description !== initialFormValues.description;
    const tasksChanged = JSON.stringify(tasks) !== JSON.stringify(initialFormValues.tasks);
    const imagesChanged = images.length > 0;
    const geographicZoneChanged = geographicZone !== initialFormValues.geographicZone;

    return titleChanged || descriptionChanged || tasksChanged || imagesChanged || geographicZoneChanged;
  }, [title, description, tasks, images, geographicZone, initialFormValues]);

  useEffect(() => {
    const urls = images.map(image => URL.createObjectURL(image));
    setPreviewUrls(urls);

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormSubmitted(true);

    // Check if images are uploaded
    if (images.length === 0 && existingImages.length === 0) {
      setToastMessage({
        type: ToastType.Error,
        message: 'Veuillez ajouter au moins une photo',
      });
      imageUploadRef.current?.focus();
      return;
    }

    // Check description length
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setDescriptionError(`La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères`);
      setToastMessage({
        type: ToastType.Error,
        message: `La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères`,
      });
      descriptionTextareaRef.current?.focus();
      return;
    }

    // Check if title is empty
    if (!title.trim()) {
      setToastMessage({
        type: ToastType.Error,
        message: 'Veuillez saisir un titre',
      });
      titleInputRef.current?.focus();
      return;
    }

    // Check if description is empty
    if (!description.trim()) {
      setToastMessage({
        type: ToastType.Error,
        message: 'Veuillez remplir la description',
      });
      descriptionTextareaRef.current?.focus();
      return;
    }

    // Check if at least one task is added
    if (!tasks.some(task => task.trim() !== '')) {
      setToastMessage({
        type: ToastType.Error,
        message: 'Veuillez ajouter au moins une tâche',
      });
      // Focus on the first task input
      const firstTaskInput = taskListRef.current?.querySelector('input');
      if (firstTaskInput) {
        firstTaskInput.focus();
      }
      return;
    }

    // Check if geographic zone is empty
    if (!geographicZone) {
      setToastMessage({
        type: ToastType.Error,
        message: 'Veuillez sélectionner une zone géographique',
      });
      comboboxRef.current?.querySelector('input')?.focus();
      return;
    }

    if (isFormValid) {
      try {
        // Always use the mockup image regardless of what was uploaded
        // Count how many images the user wanted to add
        const imageCount = existingImages.length + images.length;
        // Create an array with the mockup image repeated for each image the user wanted to add
        const imageUrls = Array(Math.max(1, imageCount)).fill(mockupImagePath);

        if (mode === 'add') {
          // Check for duplicate homes by title before adding
          if (homeExists(title)) {
            setToastMessage({
              type: ToastType.Warning,
              message: 'Un bien avec ce titre existe déjà',
            });
            return;
          }

          const result = addHome({
            title,
            description,
            tasks: tasks.filter(task => task.trim() !== ''),
            images: imageUrls,
            geographicZone,
          });

          if (result === false) {
            setToastMessage({ type: ToastType.Warning, message: 'Un bien avec ce titre existe déjà' });
            return;
          }

          setToastMessage({ type: ToastType.Success, message: 'Bien ajouté avec succès !' });
        } else {
          if (home) {
            // For edit mode, only check for duplicates if the title has changed
            if (title !== home.title) {
              if (homeExists(title)) {
                setToastMessage({ type: ToastType.Warning, message: 'Un bien avec ce titre existe déjà' });
                return;
              }
            }

            updateHome({
              ...home,
              title,
              description,
              tasks: tasks.filter(task => task.trim() !== ''),
              images: imageUrls,
              geographicZone,
            });
            setToastMessage({ type: ToastType.Success, message: 'Bien mis à jour avec succès !' });
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setToastMessage({ type: ToastType.Error, message: 'Une erreur est survenue' });
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    e.target.value = ''; // Reset obligatoire pour permettre la re-sélection

    const duplicates = newFiles.some(newFile =>
      images.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size),
    );

    if (duplicates) {
      setToastMessage({ type: ToastType.Error, message: 'Cette photo existe déjà dans la sélection !' });
      return;
    }

    setImages(prev => [...prev, ...newFiles]);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (selectedImageIndex !== undefined) {
    return (
      <FullScreenModal
        title={`Photo de ${title}`}
        imageUrl={
          selectedImageIndex < existingImages.length
            ? mockupImagePath // Use mockup for existing images
            : previewUrls[selectedImageIndex - existingImages.length] // Use preview for new images (UI only)
        }
        onClose={() => setSelectedImageIndex(undefined)}
      />
    );
  }

  return (
    <FullScreenModal title={mode === 'add' ? 'Ajouter un bien' : 'Modifier le bien'} onClose={onClose}>
      {toastMessage && (
        <ToastMessage
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => {
            setToastMessage(undefined);
            if (toastMessage?.type === ToastType.Success) onClose();
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="text-base font-medium text-foreground">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-medium text-foreground">Photos</h2>
              {(existingImages.length > 0 || previewUrls.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setImages([]);
                    setExistingImages([]);
                  }}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Tout supprimer
                </button>
              )}
            </div>
          </label>
          <div
            className={clsx(
              'grid grid-cols-3 gap-4',
              isFormSubmitted &&
                existingImages.length === 0 &&
                images.length === 0 &&
                'border border-red-500 rounded-lg p-2',
            )}
          >
            {/* Existing images */}
            {existingImages.map((url, index) => (
              <div key={`existing-${index}`} className="relative aspect-square">
                <Image
                  src={mockupImagePath} // Always use mockup for display
                  alt={`Prévisualisation ${index + 1}`}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedImageIndex(index)}
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute p-3 -top-2 -right-2 bg-red-500 text-lg text-background rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}

            {/* New images */}
            {previewUrls.map((url, index) => (
              <div key={`new-${index}`} className="relative aspect-square">
                <Image
                  src={url} // Use preview URL for UI only
                  alt={`Prévisualisation ${existingImages.length + index + 1}`}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedImageIndex(existingImages.length + index)}
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute p-3 -top-2 -right-2 bg-red-500 text-lg text-background rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Upload button */}
            <input
              type="file"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
              id="image-upload"
            />
            <label
              ref={imageUploadRef}
              htmlFor="image-upload"
              className="aspect-square flex items-center justify-center border-2 border-dashed border-foreground/30 rounded-lg hover:border-foreground/50 cursor-pointer transition-colors"
            >
              <span className="text-3xl text-foreground/50">+</span>
            </label>
          </div>
          {isFormSubmitted && existingImages.length === 0 && images.length === 0 && (
            <p className="text-red-500 text-sm mt-1">Veuillez ajouter au moins une photo</p>
          )}
          <p className="text-xs text-light mt-2 text-center">
            Note: Les images sont remplacées par une image par défaut lors de l&apos;enregistrement
          </p>
        </div>

        <div>
          <label className="text-base font-medium text-foreground">
            <h2 className="mb-2">Titre</h2>
          </label>
          <input
            type="text"
            ref={titleInputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={clsx(
              'w-full px-3 py-2 border rounded-lg bg-background text-foreground',
              'border-foreground/20 focus-visible:outline-primary',
              isFormSubmitted && title.trim() === '' && 'border-red-500',
            )}
            placeholder="Entrez le titre du bien..."
          />
          {isFormSubmitted && title.trim() === '' && (
            <p className="text-red-500 text-sm mt-1">Veuillez entrer un titre</p>
          )}
        </div>

        <div>
          <label className="text-base font-medium text-foreground">
            <h2 className="mb-2">Description</h2>
          </label>
          <div className="relative">
            <textarea
              ref={descriptionTextareaRef}
              value={description}
              onChange={e => {
                const newValue = e.target.value;
                if (newValue.length > MAX_DESCRIPTION_LENGTH) {
                  setDescriptionError(`La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères`);
                  setDescription(newValue.slice(0, MAX_DESCRIPTION_LENGTH));
                } else {
                  setDescriptionError(null);
                  setDescription(newValue);
                }
              }}
              className={clsx(
                'w-full px-3 py-2 border rounded-lg bg-background text-foreground',
                'border-foreground/20 focus-visible:outline-primary',
                (isFormSubmitted && description.trim() === '') || descriptionError ? 'border-red-500' : '',
              )}
              rows={4}
              placeholder="Décrivez les caractéristiques du bien..."
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            {isFormSubmitted && description.trim() === '' ? (
              <p className="text-red-500 text-sm mt-1">Veuillez remplir la description</p>
            ) : descriptionError ? (
              <p className="text-red-500 text-sm mt-1">{descriptionError}</p>
            ) : (
              <div className="text-right text-sm text-foreground/50 -mt-1.5">
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-base font-medium text-foreground">
            <h2 className="mb-2">Zone géographique</h2>
          </label>
          <div ref={comboboxRef}>
            <Combobox
              id="geographic-zone"
              options={geographicZones}
              value={geographicZone}
              onChange={setGeographicZone}
              placeholder="Sélectionnez une zone géographique..."
              error={isFormSubmitted && !geographicZone}
              borderColor={currentConciergerie?.color}
            />
          </div>
          {isFormSubmitted && !geographicZone && (
            <p className="text-red-500 text-sm mt-1">Veuillez sélectionner une zone géographique</p>
          )}
        </div>

        <div ref={taskListRef}>
          <TaskList tasks={tasks} setTasks={setTasks} />
          {isFormSubmitted && !tasks.some(t => t.trim() !== '') && (
            <p className="text-red-500 text-sm mt-1">Veuillez ajouter au moins une tâche</p>
          )}
        </div>

        <FormActions
          onCancel={() => {
            if (checkFormChanged()) {
              setShowConfirmDialog(true);
            } else {
              onClose();
              onCancel?.();
            }
          }}
          submitText={mode === 'add' ? 'Ajouter' : 'Enregistrer'}
          submitType="submit"
        />

        <ConfirmationModal
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={() => {
            onClose();
          }}
          title="Modifications non enregistrées"
          message="Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter sans enregistrer ?"
          confirmText="Quitter sans enregistrer"
          cancelText="Continuer l'édition"
        />
      </form>
    </FullScreenModal>
  );
}
