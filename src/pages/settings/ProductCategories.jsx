import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { Sidebar } from '../../components/common/Sidebar';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  FolderIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';
import './ProductCategories.css';

export function ProductCategories() {
  const { company, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('families');

  // State for families
  const [families, setFamilies] = useState([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);
  const [familyName, setFamilyName] = useState('');

  // State for types
  const [types, setTypes] = useState([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeName, setTypeName] = useState('');
  const [typeFamily, setTypeFamily] = useState('');

  // State for categories
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  const [loading, setLoading] = useState(true);

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    if (company?.id) {
      loadData();
    }
  }, [company?.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load families
      const familiesSnapshot = await getDocs(collection(db, 'companies', company.id, 'productFamilies'));
      setFamilies(familiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load types
      const typesSnapshot = await getDocs(collection(db, 'companies', company.id, 'productTypes'));
      setTypes(typesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load categories
      const categoriesSnapshot = await getDocs(collection(db, 'companies', company.id, 'productCategories'));
      setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Family CRUD
  const handleSaveFamily = async () => {
    if (!familyName.trim()) return;

    try {
      if (editingFamily) {
        await updateDoc(doc(db, 'companies', company.id, 'productFamilies', editingFamily.id), {
          name: familyName,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'companies', company.id, 'productFamilies'), {
          name: familyName,
          createdAt: new Date().toISOString()
        });
      }
      setShowFamilyModal(false);
      setFamilyName('');
      setEditingFamily(null);
      loadData();
    } catch (error) {
      console.error('Error saving family:', error);
    }
  };

  const handleDeleteFamily = async (id) => {
    if (!confirm(language === 'pt' ? 'Tem certeza que deseja eliminar esta família?' : 'Are you sure you want to delete this family?')) return;

    try {
      await deleteDoc(doc(db, 'companies', company.id, 'productFamilies', id));
      loadData();
    } catch (error) {
      console.error('Error deleting family:', error);
    }
  };

  // Type CRUD
  const handleSaveType = async () => {
    if (!typeName.trim()) return;

    try {
      if (editingType) {
        await updateDoc(doc(db, 'companies', company.id, 'productTypes', editingType.id), {
          name: typeName,
          familyId: typeFamily,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'companies', company.id, 'productTypes'), {
          name: typeName,
          familyId: typeFamily,
          createdAt: new Date().toISOString()
        });
      }
      setShowTypeModal(false);
      setTypeName('');
      setTypeFamily('');
      setEditingType(null);
      loadData();
    } catch (error) {
      console.error('Error saving type:', error);
    }
  };

  const handleDeleteType = async (id) => {
    if (!confirm(language === 'pt' ? 'Tem certeza que deseja eliminar este tipo?' : 'Are you sure you want to delete this type?')) return;

    try {
      await deleteDoc(doc(db, 'companies', company.id, 'productTypes', id));
      loadData();
    } catch (error) {
      console.error('Error deleting type:', error);
    }
  };

  // Category CRUD
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;

    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'companies', company.id, 'productCategories', editingCategory.id), {
          name: categoryName,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'companies', company.id, 'productCategories'), {
          name: categoryName,
          createdAt: new Date().toISOString()
        });
      }
      setShowCategoryModal(false);
      setCategoryName('');
      setEditingCategory(null);
      loadData();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm(language === 'pt' ? 'Tem certeza que deseja eliminar esta categoria?' : 'Are you sure you want to delete this category?')) return;

    try {
      await deleteDoc(doc(db, 'companies', company.id, 'productCategories', id));
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className={`categories-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="categories-header">
          <div className="header-left">
            <h1 className="logo-text" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
              AllInStock
            </h1>
            <h2 className="page-title">{language === 'pt' ? 'Gestão de Categorias' : 'Category Management'}</h2>
          </div>

          <div className="header-right">
            <LanguageToggle />
            <button className="logout-button" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        </div>

        <div className="categories-content">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'families' ? 'active' : ''}`}
              onClick={() => setActiveTab('families')}
            >
              <FolderIcon className="tab-icon" />
              {language === 'pt' ? 'Famílias' : 'Families'}
              <span className="tab-badge">{families.length}</span>
            </button>
            <button
              className={`tab ${activeTab === 'types' ? 'active' : ''}`}
              onClick={() => setActiveTab('types')}
            >
              <Square3Stack3DIcon className="tab-icon" />
              {language === 'pt' ? 'Tipos' : 'Types'}
              <span className="tab-badge">{types.length}</span>
            </button>
            <button
              className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              <TagIcon className="tab-icon" />
              {language === 'pt' ? 'Categorias' : 'Categories'}
              <span className="tab-badge">{categories.length}</span>
            </button>
          </div>

          {/* Families Tab */}
          {activeTab === 'families' && (
            <div className="tab-content">
              <div className="content-header">
                <h3>{language === 'pt' ? 'Famílias de Produtos' : 'Product Families'}</h3>
                <button className="add-button" onClick={() => {
                  setShowFamilyModal(true);
                  setEditingFamily(null);
                  setFamilyName('');
                }}>
                  <PlusIcon className="button-icon" />
                  {language === 'pt' ? 'Adicionar Família' : 'Add Family'}
                </button>
              </div>

              <div className="items-grid">
                {families.map(family => (
                  <div key={family.id} className="item-card">
                    <div className="item-icon">
                      <FolderIcon />
                    </div>
                    <div className="item-content">
                      <h4>{family.name}</h4>
                      <p>{types.filter(t => t.familyId === family.id).length} {language === 'pt' ? 'tipos' : 'types'}</p>
                    </div>
                    <div className="item-actions">
                      <button onClick={() => {
                        setEditingFamily(family);
                        setFamilyName(family.name);
                        setShowFamilyModal(true);
                      }}>
                        <PencilIcon />
                      </button>
                      <button onClick={() => handleDeleteFamily(family.id)}>
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Types Tab */}
          {activeTab === 'types' && (
            <div className="tab-content">
              <div className="content-header">
                <h3>{language === 'pt' ? 'Tipos de Produtos' : 'Product Types'}</h3>
                <button className="add-button" onClick={() => {
                  setShowTypeModal(true);
                  setEditingType(null);
                  setTypeName('');
                  setTypeFamily('');
                }}>
                  <PlusIcon className="button-icon" />
                  {language === 'pt' ? 'Adicionar Tipo' : 'Add Type'}
                </button>
              </div>

              <div className="items-grid">
                {types.map(type => (
                  <div key={type.id} className="item-card">
                    <div className="item-icon">
                      <Square3Stack3DIcon />
                    </div>
                    <div className="item-content">
                      <h4>{type.name}</h4>
                      <p>{families.find(f => f.id === type.familyId)?.name || '-'}</p>
                    </div>
                    <div className="item-actions">
                      <button onClick={() => {
                        setEditingType(type);
                        setTypeName(type.name);
                        setTypeFamily(type.familyId || '');
                        setShowTypeModal(true);
                      }}>
                        <PencilIcon />
                      </button>
                      <button onClick={() => handleDeleteType(type.id)}>
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="tab-content">
              <div className="content-header">
                <h3>{language === 'pt' ? 'Categorias de Produtos' : 'Product Categories'}</h3>
                <button className="add-button" onClick={() => {
                  setShowCategoryModal(true);
                  setEditingCategory(null);
                  setCategoryName('');
                }}>
                  <PlusIcon className="button-icon" />
                  {language === 'pt' ? 'Adicionar Categoria' : 'Add Category'}
                </button>
              </div>

              <div className="items-grid">
                {categories.map(category => (
                  <div key={category.id} className="item-card">
                    <div className="item-icon">
                      <TagIcon />
                    </div>
                    <div className="item-content">
                      <h4>{category.name}</h4>
                    </div>
                    <div className="item-actions">
                      <button onClick={() => {
                        setEditingCategory(category);
                        setCategoryName(category.name);
                        setShowCategoryModal(true);
                      }}>
                        <PencilIcon />
                      </button>
                      <button onClick={() => handleDeleteCategory(category.id)}>
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Family Modal */}
        {showFamilyModal && (
          <div className="modal-overlay" onClick={() => setShowFamilyModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>{editingFamily ? (language === 'pt' ? 'Editar Família' : 'Edit Family') : (language === 'pt' ? 'Nova Família' : 'New Family')}</h3>
              <input
                type="text"
                placeholder={language === 'pt' ? 'Nome da família' : 'Family name'}
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="modal-input"
              />
              <div className="modal-actions">
                <button className="modal-button cancel" onClick={() => setShowFamilyModal(false)}>
                  {t('cancel')}
                </button>
                <button className="modal-button confirm" onClick={handleSaveFamily}>
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Type Modal */}
        {showTypeModal && (
          <div className="modal-overlay" onClick={() => setShowTypeModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>{editingType ? (language === 'pt' ? 'Editar Tipo' : 'Edit Type') : (language === 'pt' ? 'Novo Tipo' : 'New Type')}</h3>
              <input
                type="text"
                placeholder={language === 'pt' ? 'Nome do tipo' : 'Type name'}
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                className="modal-input"
              />
              <select
                value={typeFamily}
                onChange={(e) => setTypeFamily(e.target.value)}
                className="modal-select"
              >
                <option value="">{language === 'pt' ? 'Selecione uma família' : 'Select a family'}</option>
                {families.map(family => (
                  <option key={family.id} value={family.id}>{family.name}</option>
                ))}
              </select>
              <div className="modal-actions">
                <button className="modal-button cancel" onClick={() => setShowTypeModal(false)}>
                  {t('cancel')}
                </button>
                <button className="modal-button confirm" onClick={handleSaveType}>
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>{editingCategory ? (language === 'pt' ? 'Editar Categoria' : 'Edit Category') : (language === 'pt' ? 'Nova Categoria' : 'New Category')}</h3>
              <input
                type="text"
                placeholder={language === 'pt' ? 'Nome da categoria' : 'Category name'}
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="modal-input"
              />
              <div className="modal-actions">
                <button className="modal-button cancel" onClick={() => setShowCategoryModal(false)}>
                  {t('cancel')}
                </button>
                <button className="modal-button confirm" onClick={handleSaveCategory}>
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
