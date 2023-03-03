/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import 'semantic-ui-css/components/dropdown';
import $ from 'jquery';

const getNextIndex = function getNextIndex() {
  return $('#attributesContainer').attr('data-count');
};

const addAttributesNumber = function addAttributesNumber(number) {
  const currentIndex = parseInt(getNextIndex(), 10);
  $('#attributesContainer').attr('data-count', currentIndex + number);
};

const controlAttributesList = function controlAttributesList() {
  $('#attributesContainer .attribute').each((index, element) => {
    const value = $(element).attr('data-id');
    $('#sylius_product_attribute_choice').dropdown('set selected', value);
  });
};

const modifyAttributesListOnSelectorElementDelete = function modifyAttributesListOnSelectorElementDelete(removedValue) {
  $(`#attributesContainer .attributes-group[data-attribute-code="${removedValue}"]`).remove();
};

const modifySelectorOnAttributesListElementDelete = function modifySelectorOnAttributesListElementDelete() {
  $('.attributes-group button[data-attribute="delete"]').off('click').on('click', (event) => {
    const attributeId = $(event.currentTarget).parents('.attributes-group').attr('data-attribute-code');

    $('div#attributeChoice > .ui.dropdown.search').dropdown('remove selected', attributeId);
    modifyAttributesListOnSelectorElementDelete(attributeId);
  });
};

const modifyAttributeFormElements = function modifyAttributeFormElements($response) {
  $response.find('input,select,textarea').each((index, element) => {
    if ($(element).attr('data-name') != null) {
      $(element).attr('name', $(element).attr('data-name'));
    }
  });

  return $response;
};

const isInTheAttributesContainer = function isInTheAttributesContainer(attributeId) {
  let result = false;
  $('#attributesContainer .attribute').each((index, element) => {
    const dataId = $(element).attr('data-id');
    if (dataId === attributeId) {
      result = true;
    }
  });

  return result;
};

const copyValueToAllLanguages = function copyValueToAllLanguages() {
  $('#attributesContainer').on('click', '.attribute [data-attribute="copy"]', (event) => {
    event.preventDefault();

    const $attributesContainer = $('#attributesContainer');
    const $masterAttribute = $(event.currentTarget).closest('.attribute');
    const attributeID = $masterAttribute.attr('data-id');
    const $attributeCollection = $attributesContainer.find(`[data-id="${attributeID}"]`);

    const $masterAttributeInputs = $masterAttribute.find('input:visible, select, textarea');

    $attributeCollection.each((index, attr) => {
      const $inputs = $(attr).find('input:visible, select, textarea');

      $inputs.each((i, input) => {
        if (input.getAttribute('type') === 'checkbox') {
          input.checked = $masterAttributeInputs[i].checked;
        } else {
          input.value = $masterAttributeInputs[i].value;
        }
      });
    });
  });
};

const setAttributeChoiceListener = function setAttributeChoiceListener() {
  const $attributeChoice = $('#attributeChoice');
  $attributeChoice.find('button').on('click', (event) => {
    event.preventDefault();

    const $attributeChoiceSelect = $attributeChoice.find('select');
    let queryData = '';
    const $newAttributes = $attributeChoiceSelect.val();

    if ($newAttributes != null) {
      $attributeChoiceSelect.val().forEach((item) => {
        if (!isInTheAttributesContainer(item)) {
          queryData += `${$attributeChoiceSelect.prop('name')}=${item}&`;
        }
      });
    }
    queryData += `count=${getNextIndex()}`;
    queryData += '&categoryId='+$('#owl_equipment_category').val();

    $('form').addClass('loading');

    $.ajax({
      type: 'GET',
      url: $(event.currentTarget).parent().attr('data-action'),
      data: queryData,
      dataType: 'html',
      error() {
        $('form').removeClass('loading');
      },
      success(response) {
        const attributeFormElements = modifyAttributeFormElements($(response));

        attributeFormElements.each((index, element) => {
          const localeCode = $(element).find('input[type="hidden"]').last().val();
          $(`#attributesContainer > div`).append(element);
        });

        $('#sylius_product_attribute_choice').val('');

        addAttributesNumber($.grep(attributeFormElements, a => {
          return typeof $(a).attr('data-attribute-code') !== 'undefined' && $(a).attr('data-attribute-code') !== false
        }).length);
        modifySelectorOnAttributesListElementDelete();

        $('form').removeClass('loading');
      },
    });
  });
};

const loadAttributes = function loadAttributes(action, category) {
  $('.is-ajax').addClass('loading');

  $.ajax({
    type: 'GET',
    url: action+'?categoryId='+category,
    dataType: 'json',
    error() {
      $('.is-ajax').removeClass('loading');
    },
    success(response) {
      let options = [];

      $('#attributesContainer div:first').html('');
      $('#sylius_product_attribute_choice').html('');

      if(response.length > 0) {
        response.map(item => {
          options.push({
              name: item.name,
              text: item.name,
              value: item.code
          });

          $('#sylius_product_attribute_choice').append('<option value="'+item.code+'">'+item.name+'</option>')
        })
      }

      $('#sylius_product_attribute_choice').dropdown('clear');
      $('#sylius_product_attribute_choice').dropdown('setup menu', {
        values: options
      });

      $('.is-ajax').removeClass('loading');
    },
  });
}

const setChangeCategoryListener = function setChangeCategoryListener(evt) {
  const $categorySelect = $('#owl_equipment_category'),
        action = $categorySelect.attr('data-action-attributes');

  if ($categorySelect.length) {
    $categorySelect.data('pre-value', $categorySelect.val());

    $('#confirmation-modal .button').on('click', (event) => {
      $categorySelect.trigger('equipment-change-category', [ $categorySelect.val() ]);
    });
  
    $('#confirmation-button').on('click', (event) => {
      loadAttributes(action, $categorySelect.val());
      $categorySelect.data('pre-value', $categorySelect.val());
    });
  
    $('#confirmation-modal .cancel').on('click', (event) => {
      $categorySelect.val($categorySelect.data('pre-value'));
    });
  
    $categorySelect.on('change', function() {
      if($('#attributesContainer .attributes-group[data-attribute-code]').length > 0) {
        $('#confirmation-modal .content p').html(
          '<span class="ui label red large">'+
            'Przy zmianie kategorii zapisane atrybuty zostaną utracone. <br />'+
          '</span><br />'+
          '<span style="padding-left: 10px;">Czy napewno chcesz wykonać tę akcję ?</span>'
        );
  
        $('#confirmation-modal').modal('show');
      }else{
        loadAttributes(action, this.value);
        $categorySelect.trigger('equipment-change-category', [ $categorySelect.val() ]);
      }
    });
  }
}

$.fn.extend({
  productAttributes() {
    setAttributeChoiceListener();
    setChangeCategoryListener();

    this.dropdown({
      onRemove(removedValue) {
        modifyAttributesListOnSelectorElementDelete(removedValue);
      },
      forceSelection: false,
    });

    controlAttributesList();
    modifySelectorOnAttributesListElementDelete();
    copyValueToAllLanguages();
  },
});
